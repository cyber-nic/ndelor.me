---
title: "History AI - Part II: System Design"
date: 2023-07-10T01:26:00-00:00
tags: ["history ai", "system-design"]
draft: false
---

# Assumptions / Constraints

1. We will operate on a dataset of 2,000,000 jpeg images / 500GB
1. The initial budget is $1000. It is expected that this will increase, but the goal is to re-evaluate the budget prior to spending.
1. We will operate using the Google Cloud Platform (GCP) but might explore other cloud offerings when performance or cost become a concern

# System Design

![breakdown](/images/hai-system-breakdown.svg)

## Scraping

I've implemented scrapers using various languages including PowerShell, Node.js, Python, and Go. This scraper will also be implemented using Go. At a very high level, the scraping service outputs jpeg images in a folder structure specific to the site being scraped.

**Input**: url string

**Output**: image files on disk or in bucket

## Image PreProcessing

One of the challenges faced is that all the images scraped contain a repetitive watermark. To enhance the quality of subsequent text extraction (OCR), the primary objective is to remove the watermark from these images. By doing so, I aim to obtain clearer and more accurate results.

**Input**: Image (ie. location of)

**Output**: New enhanced image stored in bucket

## OCR and Text Extraction

We strive to perform Optical Character Recognition (OCR) and extract text from a diverse range of sources, including handwritten and typed documents. It's important to note that many documents may also contain additional layers of handwritten text, adding complexity to the extraction process.

**Input**: Image (ie. location of)

**Output**: Text or JSON

## NLP and NER

Using Natural Language Processing (NLP), the objective is to perform Named Entity Recognition (NER). This involves identifying and categorizing named entities such as people, organizations, locations, and dates within the extracted text. By leveraging NLP techniques, we can gain valuable insights from the recognized entities.

**Input**: Text

**Output**: JSON

## AI

In the final phase, I will focus on analyzing the NLP entities extracted from the previous steps. One potential approach is to utilize a hash table to store NLP entities per image, allowing us to identify patterns and correlations. Additionally, we can explore advanced techniques like using Tensorflow to delve even deeper into the analysis.

**Input**: TBD

**Output**: TBD

# Inputs / Outputs

This diagram illustrates the potential flow of data from one service to the next.

![io](/images/hai-system-breakdown-i_o.svg)

Inputs in blue and Outputs in red.
