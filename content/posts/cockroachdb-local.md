---
title: "CockroachDB Local"
date: 2023-09-03T07:12:05+01:00
lastmod: 2024-01-11T09:09:25+01:00
tags: ["go", "CockroachDB"]
draft: false
---

## update 2024-01-11

While not central to this article the use of the CRC32 hash in the code below is noticeable. Since writing this article I learned that the CRC32, particularly the CRC32C variant used by Google Cloud Storage (GCS), is optimized for error detection, not as a unique identifier for data. It has a higher probability of collisions (1 in 4.3 billion) compared to more robust algorithms. To overcome these limitations, SHA-256, a more robust hashing algorithm, is recommended. SHA-256 significantly reduces the likelihood of hash collisions, ensuring better uniqueness for data identification.

# Overview

I needed a SQL database for a project and decided to try out CockroachDB. Setting up the free tier cluster was amazingly simple. Unfortunately after only about ~200,000 queries the 50M RUs were completely used up. The [docs](https://www.cockroachlabs.com/docs/cockroachcloud/plan-your-cluster-serverless#request-units) point out `an RU is an abstracted metric that represent the size and complexity of requests made to your cluster`. The queries were very simply so this did come as a surprise. CockroachDB seems like a good product, but the free tier is in fact quite limited.

# Query examples

## Example 1: Create table

This query is called once at startup. If the table does not exist it is created. Notice the elegabt handling of the error code.

```go {}
// initTable function performs a CockroachDB sql query using pgx. It uses crdbpgx for transaction handling (retries).
func initTable(ctx context.Context, tx pgx.Tx) error {
	// Create the images table
	// https://www.cockroachlabs.com/docs/stable/create-table#:~:text=Create%20a%20new%20table%20only,.%2C%20of%20the%20new%20table.
	_, err := tx.Exec(ctx,
		"CREATE TABLE IF NOT EXISTS images (name STRING PRIMARY KEY, section STRING, prefix STRING, size FLOAT, crc32 OID)")
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			// fmt.Println(pgErr.Message) // => syntax error at end of input
			// fmt.Println(pgErr.Code) // => 42601
			if pgErr.Code != "42P07" {
				return err
			}
		}

	}

	return nil
}

// ...

func main() {
	// database client
	dsn := fmt.Sprintf("postgresql://%s:%s@%s", username, password, connectionString)
	roach, err := pgx.Connect(ctx, dsn)
	defer roach.Close(ctx)
	if err != nil {
		os.Exit(exitCodeErr)
	}

  // ...

  // Set up table
  err := crdbpgx.ExecuteTx(svc.Context, roach, pgx.TxOptions{}, func(tx pgx.Tx) error {
    return initTable(svc.Context, tx)
  })
  if err != nil {
    panic(err)
  }
}
```

## Example 2: Get

```go {}
// getImageCount function performs a CockroachDB sql query using pgx. It uses crdbpgx for transaction handling (retries).
// The inner function allows to return the count value from the query since crdbpgx does not support returning values other than an error.
func getImageCount(ctx context.Context, roach *pgx.Conn, crc32 uint32) (int, error) {
	// init count
	count := 0

	// check if image exists in database
	err := crdbpgx.ExecuteTx(ctx, roach, pgx.TxOptions{}, func(tx pgx.Tx) error {
		inner := func() error {
			// inner function
			rows, err := tx.Query(ctx, "SELECT COUNT(*) FROM images WHERE crc32 = $1", crc32)
			if err != nil {
				return err
			}

			for rows.Next() {
				if err := rows.Scan(&count); err != nil {
					return err
				}
			}

			return nil
		}

		return inner()
	})
	if err != nil {
		return count, err
	}

	return count, nil
}

func main() {
  // database client
  // ...

  // attrs is a gcp bucket object
	count, err := getImageCount(ctx, roach, attrs.CRC32C)
  if err != nil {
    panic(err)
  }
}
```

# CockroachDB local

As a result of the free tier being insufficent for my needs, and not wanting to refactor code (too much), I decided to try out the local version. This is a single node version that can be run on a local machine. It is not intended for production use, but for my particular exercice it was sufficient. The setup was a little more involved than the cloud version, but still very simple. The following are the steps I took to get it up and running.

WARNING: This is not intended for production use. It is a single node version that is not secure. It is intended for local development only. Also, security was not a concern for me.

Below are notes, not a proper turorial. I am not a CockroachDB expert. I am just documenting the steps I took to get it up and running.

[Installation instruction](https://www.cockroachlabs.com/docs/v23.1/install-cockroachdb-linux)

# download

```bash {}
wget https://binaries.cockroachdb.com/cockroach-v23.1.8.linux-amd64.tgz
tar xzf cockroach-v23.1.8.linux-amd64.tgz
mv cockroach-v23.1.8.linux-amd64/ cockroach
```

# setup

```bash {}
mkdir certs my-safe-directory

./cockroach/cockroach cert create-ca --certs-dir=certs --ca-key=my-safe-directory/ca.key

./cockroach/cockroach cert create-node localhost $(hostname) --certs-dir=certs --ca-key=my-safe-directory/ca.key

./cockroach/cockroach cert create-client root --certs-dir=certs --ca-key=my-safe-directory/ca.key
```

# start

https://www.cockroachlabs.com/docs/stable/cockroach-start

```bash {}
./cockroach/cockroach start-single-node --certs-dir=certs --store=node1 --listen-addr=localhost:26257 --http-addr=localhost:8080

./cockroach/cockroach \
start-single-node \
--store=node1 \
--listen-addr=localhost:26257 \
--http-addr=localhost:8080

curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health

ls ./node1/logs
```

# connect

```bash {}
./cockroach/cockroach sql --certs-dir=certs --host=localhost:26257
```

# create database and user

```bash {}
CREATE DATABASE mydb;
SHOW databases;
USE mydb;

CREATE USER foobar WITH PASSWORD 'password';
ALTER ROLE foobar WITH PASSWORD 'password1';

GRANT ALL ON DATABASE mydb TO foobar WITH GRANT OPTION;
SHOW grants;

GRANT admin to foobar;
```
