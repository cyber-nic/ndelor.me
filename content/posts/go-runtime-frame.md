---
title: "Go Runtime Frames"
date: 2023-09-16T09:25:51+01:00
lastmod: 2023-10-16T13:25:51+01:00
tags: ["go"]
draft: false
---

Both the `go-kit/log` and `rs/zerolog` loggers provide a `Caller` method that returns the caller of the function that called it. This is useful for logging the function name in the log output. This functionality is immensly useful and roused my curiosity as to how it is implemented.

[zerolog logger caller](https://github.com/rs/zerolog#add-file-and-line-number-to-log) example

```go
  import "github.com/rs/zerolog"
	import "github.com/rs/zerolog/log"

	func main() {
		log.Logger = log.With().Caller().Logger() // <--
		log.Debug().Str("foo", "bar").Msg("This will be logged with a caller")
	}
```

[go-kit logger caller](https://github.com/go-kit/log#timestamps-and-callers) example

```go
	import "github.com/go-kit/log"
	import "github.com/go-kit/log/level"

	func main() {
		var logger log.Logger
		logger = log.NewLogfmtLogger(os.Stdout)
		logger = log.With(logger, "caller", log.DefaultCaller) // <--
		level.Debug(logger).Log("msg", "This will be logged with a caller", "foo", "bar")
	}


```

These are code snippets showing how this can be achieved using the `runtime` package.

```go
import "runtime"

// Caller returns the caller of the function that called it.
func Caller() string {
	pc := make([]uintptr, 15)
	n := runtime.Callers(2, pc)
	frames := runtime.CallersFrames(pc[:n])
	frame, _ := frames.Next()
	return frame.Function
}

// Trace returns the file, line and function name of the caller
func Trace() (string, int, string) {
	pc := make([]uintptr, 15)
	n := runtime.Callers(2, pc)
	frames := runtime.CallersFrames(pc[:n])
	frame, _ := frames.Next()
	return frame.File, frame.Line, frame.Function
}
```

This is a more complete example that returns the frame at a specified index. This is useful when you want to log the caller of the function that called the function that called it. See this [go playground](https://go.dev/play/p/cv-SpkvexuM) example for a demonstration.

```go
func getFrame(skipFrames int) runtime.Frame {
	// We need the frame at index skipFrames+2, since we never want runtime.Callers and getFrame
	targetFrameIndex := skipFrames + 2

	// Set size to targetFrameIndex+2 to ensure we have room for one more caller than we need
	programCounters := make([]uintptr, targetFrameIndex+2)
	n := runtime.Callers(0, programCounters)

	frame := runtime.Frame{Function: "unknown"}
	if n > 0 {
			frames := runtime.CallersFrames(programCounters[:n])
			for more, frameIndex := true, 0; more && frameIndex <= targetFrameIndex; frameIndex++ {
					var frameCandidate runtime.Frame
					frameCandidate, more = frames.Next()
					if frameIndex == targetFrameIndex {
							frame = frameCandidate
					}
			}
	}

	return frame
}

caller := getFrame(1).Function
```
