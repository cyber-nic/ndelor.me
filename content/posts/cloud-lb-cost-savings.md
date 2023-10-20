---
title: "Cloud Load Balancer Cost Savings"
date: 2023-10-20T10:45:42+01:00
lastmod: 2023-10-20T10:45:42+01:00
tags: ["aws", "gcp", "cloud"]
draft: false
---

### Context

In an effort to learn more about the Google Cloud Platform, I built and deployed a website using Cloud Run functions, hosted behind a GCP Load Balancer. The performance was great. Even without conducting any performance or benchmark tests, I observed that the website was very responsive globally, as relayed by a family member in Singapore.

Unfortunately, the costs were not as favorable. The cost of running a single load balancer was about ~$25 per month. It is simply too much for a personal project that is not generating any revenue.

This articles discusses the journey to saving $25/month.

### It adds up

The chart below shows the daily cost of running a single load balancer for a few months.
<lu>

<li><span style="color: #00abc0;">ManagedZone</span> - This is a fixed cost. $0.06-$0.07/day.</li>
<li><span style="color: #7cb342;">Network Cloud Armor Rule</span> - Another fixed cost. $0.033/day.</li>
<li><span style="color: #ff8f00;">Network Cloud Armor Policy</span> - Starts at $0.161/day and creeps up to $0.167/day on the chart below. This is a fixed cost.</li>
<li><span style="color: #4184f3;">HTTP Load Balancing: Global Forwarding Rule Minimum Service Charge</span> - Renamed to <span style="color: #ff5722;">Cloud Load Balancer Forwarding Rule Minimum Global</span> on August 1st. This is a fixed cost. $0.6/day.</li>
<li><span style="color: #aa46bb;">Network Load Balancing: Forwarding Rule Minimum Service Charge in Virginia</span> - Cost $0.672/day for the two days I let it run completely.</li>
</ul>

![gcp-spending](/images/cloud-lb-cost-savings-gcp.png)

### Options

The journey began with the gruntwork's wonderful GCP load balancer terraform module ([link](https://github.com/gruntwork-io/terraform-google-load-balancer)). By default this creates a global LB which costs ~$0.80/day or ~$25/month.

The module was tweaked to support creating a regional LB which was deployed in the us-east-4 (Virginia) region in May 2023. For clarity, this regional LB replaced the global LB. This blew my mind: the cost increase by ~$0.07 a day to ~$0.87/day or ~$27/month. As you can understand this was not the result I anticipated and the change was quickly reverted.

There are multiple reddit posts (r/googlecloud) discussing the cost of running a load balancer. The general consensus is that the cost is too high for individual projects. One might point out that there are multiple possible GCP LB configurations. If there is a cheaper option I have not found it.

### AWS to (my wallet's) rescue

AWS does have a free tier load balancer but it is only available for 12 months after creating an account. This felt like punting the problem down the road. I wanted a solution that would work for the long term.

In comes AWS CloudFront. I will update this post in a few weeks once enough billing data has been gathered, but my experience thus far with CloudFront suggests the cost will be much more manageable. Serving contextchronicles.com is currently costing ~$0.50/month for Route53, $0 for CloudFronts.

Setting up the CloudFront distribution posed no challenge. One important lesson was that the behavior url path cannot be removed when forwarded to an origin. As a result my gin gonic API needed to listen on the `/api` path and my GCP bucket assets needed to be moved into a /static folder to match the `/api/*` and `/static/*` behaviors path.

#### CloudFront GCP Origins

For a Google Cloud Storage bucket the CloudFront origin domain should be `storage.googleapis.com` and the origin path should be the bucket name. For example, `/foo-bar-bucket`.

While my webapp behavior seemed to work right out of the box the API origin did not. The API behavior was returning a 404 or 401 error.

Several Cache Policy and Origin Request Policy combinations result in a 404. It's very hard to troubleshoot this as the API isn't actually receiving any traffic and thus there are no logs or metrics.

The combination that ended up working is the `Managed-CachingDisabled` Cache Policy and the `AllViewerExceptHostHeader` Origin Request Policy.

Getting CloudFront to forward the `Authorization` header was slighty more involved then anticipated although it turns out this matter is discussed [here](https://repost.aws/knowledge-center/cloudfront-authorization-header) and documented [here](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html#add-origin-custom-headers-forward-authorization).

### Conclusion

Navigating cloud infrastructure can be complex and costly, but my switch from GCP Load Balancer to AWS CloudFront underscored the value of research and adaptability. While challenges are inevitable, they often pave the way to more efficient and cost-effective solutions.

My personal project website [www.4ks.io](https://www.4ks.io) now costs $25/month less to operate by combining AWS CloudFront and GCP Cloud Run.
