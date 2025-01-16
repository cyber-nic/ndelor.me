---
title: "History AI - Part IV: Computer Vision"
date: 2023-07-11T17:33:59-04:00
tags: ["history", "ai", "computer vision", "projects"]
draft: false
---

I have 2,000,000 images which all containt a watermark pattern. This post will explore options for removing the watermarks in order to improve the quality of the OCR operations to follow.

# 1) Skipping Watermark Removal

The cheapest option in terms of time and resources is to skip watermark removal altogether. This can be done by filtering out the known watermark text from the OCR results. This is the best short-term solution, as it is relatively easy to implement and does not require any additional software.

# 2) SAAS Image AI

There are a number of SAAS image AI services that can be used to remove watermarks. One such service is watermarkremover.io. This service allows you to upload images and have the watermarks removed automatically. However, the quality of the results can vary, and the cost can be prohibitive for large datasets.

![watermarkremover](/images/hai-computer-vision-watermarkremover.jpg)

# 3) OSS Image AI

There are also a number of open-source image AI services that can be used to remove watermarks. One such service is [lama-cleaner](https://github.com/Sanster/lama-cleaner). This service is free to use and can be easily installed and run. However, the quality of the results can be inconsistent, and the service may not be able to remove all watermarks. Results were disapointing with my dataset.

# 4) Custom Watermark Removal Service

The most reliable way to remove watermarks is to build a custom watermark removal service. This can be done using a variety of open-source tools, such as OpenCV. However, this option requires the most time and effort, as you will need to develop and test your own code.

I found examples of gocv examples lacking. While it isn't the solution retained today I plan to loop back and explore more.

Here is a very basic gocv sample (which clearly doesn't delivery the expected results).

```go {}
package main

import (
	"fmt"
	"os"

	"gocv.io/x/gocv"
)

func main() {
	// read image and watermark mask
	i := os.Args[1]
	m := os.Args[2]

	// load image
	img := gocv.IMRead(i, gocv.IMReadGrayScale)
	if img.Empty() {
		fmt.Printf("Error reading image from: %v\n", i)
		return
	}

	// load watermark mask
	mask := gocv.IMRead(m, gocv.IMReadGrayScale)

	// create output mat
	out := gocv.NewMat()

	// Remove the watermark from the image.
	gocv.Subtract(img, mask, &out)

	// view images
	w0 := gocv.NewWindow("Src")
	w1 := gocv.NewWindow("Dst")
	w2 := gocv.NewWindow("Mask")
	for {
		w0.IMShow(img)
		w2.IMShow(mask)
		w1.IMShow(out)
		if w0.WaitKey(1) >= 0 || w2.WaitKey(1) >= 0 {
			break
		}
	}
}
```

![snippet](/images/hai-computer-vision-apply1.jpg)
