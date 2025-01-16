---
title: "History AI - Part II: System Design"
date: 2023-07-10T01:26:00-00:00
lastmod: 2023-11-02T5:10:00-00:00
tags: ["history", "ai", "system-design", "projects"]
draft: false
---

# Assumptions / Constraints

1. We will operate on a dataset of ~2,000,000 jpeg images / ~500GB
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

**Update (09/10/23)**: After some analysis I am of the opinion that the work required to remove the watermark or the processing cloud costs would not provide the necessary ROI to justify the effort and exepense. Instead, tests have demonstrated that the OCR process does detect the watermark and as a result it can be filtered out prior to NLP processing.

**Update (09/10/23)**: Deeper analysis of the upcoming OCR costs ([$1.50/1000 pages](https://cloud.google.com/document-ai/pricing#:~:text=%241.50%20per%201%2C000%20pages)) have led me to the conclusion that cost-saving measures are required. A possible solution is the aggregation of several images into a single "page".

**Update (2/11/23)**: Final conclusion, the idea of combining images into a single page is pointless has GCP's Document AI OCR documentation states that it will auto-detect, and bill accordingly, for multiple pages in a single image. Since the expected cost of OCR'ing this many images is ~$5000USD we've applied for a Google Research grant to cover the costs. Waiting on a response.

**Input**: Image (ie. location of)

**Output**: New enhanced image stored in bucket

## OCR and Text Extraction

We strive to perform Optical Character Recognition (OCR) and extract text from a diverse range of sources, including handwritten and typed documents. It's important to note that many documents may also contain additional layers of handwritten text, adding complexity to the extraction process.

**Input**: Image (ie. location of)

**Output**: Text or JSON

## NLP and NER

Using Natural Language Processing (NLP), the objective is to perform Named Entity Recognition (NER). This involves identifying and categorizing named entities such as people, organizations, locations, and dates within the extracted text. By leveraging NLP techniques, we can gain valuable insights from the recognized entities.

Part of this step will be producing a weighted score for each entity relationship. This would potentially allow us to visually identify the most important entities and relationships using a tool like [Gephi](https://gephi.org/).

**Input**: Text

**Output**: JSON

## LLM

The final step is to leverage the extracted entities and relationships to produce a Large Language Models (LLM). It will be interesting to see if the model is capable of identifying patterns and relationships that are not immediately obvious to the human eye. I'm currently considering multiple options for this step, including GPT-4, [H2O LLM Studio](https://github.com/h2oai/h2o-llmstudio), along with other more customized solutions (as an opportunity to learn more about LLM fundamentals).

**Input**: TBD

**Output**: TBD

# Inputs / Outputs

This diagram illustrates the potential flow of data from one service to the next.

![io](/images/hai-system-breakdown-i_o.svg)

Inputs in blue and Outputs in red.
