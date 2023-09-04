# Personal blog

hosted at: http://contextchronicles.com.s3-website-us-east-1.amazonaws.com/
https://contextchronicles.com
http://contextchronicles.com

# create new blog post

```
hugo new posts/ai-making-history.md
```

# run local hugo

```
hugo server -w -D
```

# deploy to aws

```
aws s3 sync ./public s3://contextchronicles.com
# or
hugo deploy aws
```
