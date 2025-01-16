dev:
	hugo server -w -D

build:
	hugo

deploy:
	hugo deploy aws