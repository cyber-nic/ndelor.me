# Personal blog
hosted at: http://ndelor.me.s3-website-us-east-1.amazonaws.com/
https://ndelor.me
http://ndelor.me

# create new blog post

```
hugo new posts/ai-making-history.md
```

# run local hugo

```
hugo server -w -D
```

# publish

```
hugo
```

# deploy to aws

```
aws s3 sync ./public s3://ndelor.me
# or
hugo deploy aws
```

# download and install

```
git clone git@github.com:cyber-nic/ndelor.me.git
git submodule update --init
```
