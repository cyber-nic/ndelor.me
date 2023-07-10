hugo new posts/ai-making-history.md

hugo server -w
hugo server -w -D

aws s3 sync ./public s3://contextchronicles.com

hugo deploy aws
