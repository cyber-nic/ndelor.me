---
title: "History AI - Part III: Scraping"
date: 2023-07-10T22:09:00-00:00
tags: ["history ai", "go"]
draft: false
---

# Target

The target site is completely free and public. While the site's performance is sufficient it unfortunately isn't well maintained: SSL cert is expired. Luckily the sought after information is available directly via REST calls. No html parsing necessary.

# Process

The scraping process was performed on a Cloud Compute, Regular Performance, $5/month VM on Vultr.com. The attached 120GB block storage was quickly expanded to 500GB, which increased the cost from $3.00/month to $12.50/month. The scraping operation completed in approximately 1 month using tmux.

The documents on the target site were stored in a tree structure, with a handful of top-level nodes. Only the leaf nodes contained images. The website itself fetched a few results at a time, but the same pagination mechanism could be used to fetch significantly larger batches.

# The Scraper

I created a scraper using a standard Go service architecture. The scraper was resilient to errors and system or network failures. The base code for the scraper can be found at [cyber-nic/go-svc-tpl](https://github.com/cyber-nic/go-svc-tpl).

Only two scrapers were ever started concurrently. These scrapers targeted different data trees and had network delays of 500 and 1000 milliseconds respectively to limit the strain on the target site.

The scraper service was originally designed using a recurring function called for each new node encountered. However, this made it difficult to debug. I eventually changed the design so that each data node was added to a queue using the `container/list` package. The queue size was one of the main metrics that I tracked, and it often reached 500,000.

```go {}
type ctxQueue struct{}

func contextWithQueue(ctx context.Context, q *list.List) context.Context {
	return context.WithValue(ctx, ctxQueue{}, q)
}

func queueFromContext(ctx context.Context) *list.List {
	if q, ok := ctx.Value(ctxQueue{}).(*list.List); ok {
		return q
	}
	panic("fail to get queue from context")
}
```

It was decided to simply re-created the api folder structure locally as this would allow human use more effective.

The downloadFile function has to take into consideration that the SSL certificate is expired.

```go {hl_lines=[3,4]}
func downloadFile(URL, fileName string) (string, error) {
	// Get the response bytes from the url
	t := &tls.Config{InsecureSkipVerify: true}
	http.DefaultTransport.(*http.Transport).TLSClientConfig = t
	response, err := http.Get(URL)
	if err != nil {
		return fileName, err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return fileName, errors.New("received non 200 response code")
	}

	// Create a empty file
	file, err := os.Create(fileName)
	if err != nil {
		return fileName, err
	}
	defer file.Close()

	// Write the bytes to the file
	_, err = io.Copy(file, response.Body)
	if err != nil {
		return fileName, err
	}

	return fileName, nil
}
```

An interesting problem was not knowing if the api would return a leaf or non-leaf node. Different branches were of various depths so it was challenging to predict. Keeping in mind that leaf nodes have an `images` property while non-leaf nodes have `children` nodes my solution was to create a single struct with the combined properties of both.

```go {}
// Node is the representation of a leaf or non-leaf node returned by the api.
type Node struct {
  // both leaf and non-leaf have ID
	ID string `json:"id"`
	// non-leaf
	Childs []Child `json:"childs"`
	// leaf only
	Data []Image `json:"data"`
}
```

Using reflection it possible to write a handy HasField function which help identify if a node is a leaf or non-leaf.

```go {}
// HasField function returns true if the provided field name exists
// as a field on the Node
func (n Node) HasField(f string) bool {
	value := reflect.ValueOf(n)
	field := value.FieldByName(f)
	return field.IsValid()
}

n := Node{
	ID: "abc",
	Childs: []Images,
}

n.HasField("Childs") // true
n.HasField("Data") // false
```

Finally, all json returned by the api was saved to disk. This allows for checking for a local copy prior of performing a network call and possibly avoiding it, saving time and resources on both the scraper and the target site.

The final tally is over 2,000,000 images of typed and handwritten documents. These were copied from the vultr blockstorage to a GCP bucket.

```bash
gsutil -m rsync -r ./bar gs://hai-foo-source/bar
```
