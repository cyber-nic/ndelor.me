---
title: "Capturing WebSocket Traffic with Mitmproxy"
date: 2024-12-18T20:13:21Z
tags: ["code"]
draft: false
---

Recently I wanted to reverse engineer an application that uses websockets to communicate with with its server. I wanted to see the data that was being sent and received. I used mitmproxy to intercept the traffic and view it in plain text.

WebSocket traffic operates over TCP, initially using HTTP for handshake (usually port 80 for unencrypted or 443 for encrypted connections). After the handshake, it establishes a persistent, full-duplex communication channel over the same TCP connection.

Capturing WebSocket traffic can be challenging. This post explores two approaches:

1. Direct approach: Traffic → Local Proxy → Internet
2. Using Redsocks: Traffic → Redsocks → Local Proxy → Internet

My key challenges ended up being:

1. Trusting mitm's self-signed cert
1. Forcing websocket traffic through local proxy

This post is tailored to Ubuntu 24.04

Finally, it is important to remember that this is a fully functional **hack**, not a production solution. While mitmproxy supports intercepting and proxying websocket traffic our goal is to view thew content of the messages exchanged via websocket. To achieve this aim the [websocket-simple.py](https://github.com/mitmproxy/mitmproxy/blob/main/examples/addons/websocket-simple.py) addon was used to simply publish message content to the mitm event log. **mitmdump** is the used to save this to file.

## Local Proxy Options

Local Proxy are interactive, SSL/TLS-capable intercepting applications. They allow to intercept, inspect, modify, and replay web traffic. It is commonly used for debugging, testing, privacy measurements, and penetration testing. Mitmproxy can handle HTTP, HTTPS, and WebSocket traffic, making it a versatile tool for analyzing and manipulating network communications.

Over the years I've used several lightweight local proxies. While this post will use mitmproxy, the steps should be similar with other tools (that support websockets).

| Feature               | [mitmproxy](https://mitmproxy.org/) | [Charles](https://www.charlesproxy.com/) | [Fiddler](https://www.telerik.com/fiddler) |
| --------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------------ |
| **Platform**          | Cross-platform (CLI/GUI)            | Cross-platform (macOS, Windows)          | Cross-platform (Windows, macOS)            |
| **Open Source**       | Yes                                 | No                                       | No                                         |
| **Interface**         | CLI and web-based GUI               | GUI-focused                              | GUI-focused                                |
| **Ease of Use**       | Medium (CLI requires learning)      | High (intuitive GUI)                     | High (intuitive GUI)                       |
| **Protocol Support**  | HTTP/HTTPS, WebSocket               | HTTP/HTTPS                               | HTTP/HTTPS, WebSocket                      |
| **Advanced Features** | Scriptable in Python                | Extensive session handling               | Scriptable with .NET                       |
| **Price**             | Free                                | Paid (trial available)                   | Free (Pro version available)               |

This post uses **mitmproxy** because it is free and works well.

## Basic Setup

### Installation

Download and install mitmproxy from the official website. Avoid installing via apt as the version will be outdated. The installation package will include mitmproxy, mitmweb and mitmdump. In this post we'll use both **mitmproxy** and **mitmdump**.

1. **mitmproxy**: Best for terminal enthusiasts who need interactive control over traffic in real time.
1. **mitmweb**: Suited for users preferring a graphical interface with more visual traffic inspection.
1. **mitmdump**: Ideal for automated workflows and scripting in environments where a UI is unnecessary.

> Binaries need to be in a location accessible by the `mitmproxy` user. Keep reading.

```bash
$ sudo cp mitm* /usr/local/bin/

# Check version
$ mitmproxy -v
Mitmproxy: 11.0.2 binary
Python:    3.12.7
OpenSSL:   OpenSSL 3.4.0 22 Oct 2024
Platform:  Linux-6.8.0-51-generic-x86_64-with-glibc2.39
```

### Basic Usage

The next step for intercepting HTTP/HTTPS traffic is to force traffic through the proxy. This can be done at the network device, os routing (eg. iptables) or application level.

Many applications honor the `http_proxy` enviornment variables:

```
export http_proxy=http://127.0.0.1:8080
export https_proxy=https://127.0.0.1:8080
```

Start **mitmproxy** or **mitmweb** and view flowing traffic. For intercepting websocket traffic keep reading.

### Create User

A little further down **iptables** rules will be created to funnel all outgoing os traffic through our proxy. An extremely important exception will be the local proxy's own traffic. Without this exception an infinit loop is created: the proxy's traffic is funneled back to the proxy. Creatung a user helps avoid this problem.

> It is **highly** recommended that mitmproxy run as a dedicated user.

```bash
# create user and user's home dir
sudo useradd -m -s /bin/bash mitmproxy
sudo chown -R mitmproxy:mitmproxy /home/mitmproxy/.mitmproxy

# become mitmproxy
sudo su - mitmproxy

# run mitmproxy as mitmproxy in order to generate self-signed certs
mitmproxy
# (exit)
```

Notes:

1. mitmproxy (user) is **not** being granted permission to **sudo** as this is unecessary. Keep this in mind as you run below commands.
1. mitmproxy (app) will generate self-signed certs in ~/.mitmproxy on it's first run.

### Trust Self-Signed Cert

This was a major pain on Ubuntu 24.04. While the official instructions say to copy `mitmproxy-ca-cert.pem` over to `/usr/local/share/ca-certificates/mitmproxy.crt` **this does not work**. Instead:

```bash
# convert PEM to CRT
openssl x509 -in mitmproxy-ca-cert.cer -inform PEM -out mitmproxy-ca-cert.crt

# copy CRT to /usr/share/ca-certificates
sudo cp /home/mitmproxy/.mitmproxy/mitmproxy-ca-cert.crt /usr/share/ca-certificates/mitmproxy-ca-cert.crt

# notice /usr/share rather then /usr/local/share ^

# add to ca-certificates.conf
echo mitmproxy-ca-cert.crt | sudo tee -a /etc/ca-certificates.conf

# update ca certs
sudo update-ca-certificates
```

1. You might have to reopen some apps for the trust to take effect.
1. It might still not be enough! In our case we'll also use nodejs's NODE_EXTRA_CA_CERTS env var. Keep reading.

### Start Proxy

As mentioned earlier our goal is to view websocket message content. **mitmproxy** does not offer this out of the box, but it can be achieved using an addon.

Note:

1. Nothing will be displayed until the iptables sectin below is completed
1. Once flowing, websockets show a single entry in the flow log. Hit 'E' to view the Event Log.

```bash
# become mitmproxy (user)

# download websocket-simple.py addon
wget https://github.com/mitmproxy/mitmproxy/blob/main/examples/addons/websocket-simple.py

# start mitmproxy
mitmproxy --showhost -s websocket_simple.py --mode transparent --set websocket=true -v

# use mitmdump to save to file
mitmdump --showhost -s websocket_simple.py --mode transparent --set websocket=true -v | tee -a eventlog.txt
```

- **showhost**: Use the Host header to construct URLs for display.
- **s websocket_simple.py**: Our addon to print websocket messages to the mitm event log
- **mode transparent**: This is **required** when apps are not aware of the proxy -- which is the current case as iptables forces the traffic through the proxy.
- **websocket**: [optional](https://docs.mitmproxy.org/stable/concepts-options/#websocket) Enable/disable WebSocket support. WebSocket support is enabled by default.
- **v**: verbose

### OS Routing

Configure **iptables** to route all os traffic to the proxy.

> Note: Rebooting your system will reset routing rules to their original values.

#### Create rules

```bash
# enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1

# 1. Exclude localhost traffic
sudo iptables -t nat -A OUTPUT -o lo -j ACCEPT

# 2. Exclude traffic from mitmproxy's user
sudo iptables -t nat -A OUTPUT -m owner --uid-owner mitmproxy -j ACCEPT

# 3. Exclude traffic destined for mitmproxy itself
sudo iptables -t nat -A OUTPUT -p tcp --dport 8080 -j ACCEPT

# 4. Redirect HTTP/HTTPS traffic to mitmproxy
sudo iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 8080
sudo iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8080
```

#### View

```bash
# quick view
sudo iptables -t nat -L -v

# view with line numbers -- useful for deleting
sudo iptables -t nat -L -v --line-numbers
```

At this point traffic should be flowing and `sudo iptables -t nat -L -v | grep REDIRECT` should show non-zero pkts bytes.

#### Reverting

1. Run `sudo iptables -t nat -L -v --line-numbers` to get the line number, followed by `sudo iptables -t nat -D OUTPUT 6` where 6 is the desired rule to remove.
1. Hard reset by rebooting you system.

## Intercept NodeJS websocket traffic

Somewhat surprisingly after everything above NodeJS was still not trusting **mitmproxy**'s self-siged cert. Thankfully NODE_EXTRA_CA_CERTS did the trick:

```bash
export NODE_EXTRA_CA_CERTS=/usr/share/ca-certificates/mitmproxy-ca-cert.crt
```

## Troubleshooting

If you encounter issues, check:

1. File descriptor limits:

```bash
ulimit -n
# Increase if needed
ulimit -n 65535
```

2. Process connections

```bash
lsof -p $(pidof mitmproxy)
```

3. Test connection

```bash
# if mitmproxy has mode=transparent
curl -v https://www.ndelor.me/

# if mitmproxy does **NOT** have mode=transparent
curl -v --proxy http://127.0.0.1:8080 https://www.ndelor.me/
```

## Optional: Using Redsocks

In the end I didn't get this solution to work but am including it here for future reference.

[redsocks](https://github.com/darkk/redsocks) – is a transparent TCP-to-proxy redirector that allows you to redirect any TCP connection to SOCKS or HTTPS proxy using your firewall, so redirection may be system-wide or network-wide.

### Installation

```bash
sudo apt install redsocks
```

### Iptables

```bash

## Create new chain

sudo iptables -t nat -N REDSOCKS

# Ignore LANs and some other reserved addresses.

sudo iptables -t nat -A OUTPUT -d 0.0.0.0/8 -j RETURN
sudo iptables -t nat -A OUTPUT -d 10.0.0.0/8 -j RETURN
sudo iptables -t nat -A OUTPUT -d 100.64.0.0/10 -j RETURN
sudo iptables -t nat -A OUTPUT -d 127.0.0.0/8 -j RETURN
sudo iptables -t nat -A OUTPUT -d 169.254.0.0/16 -j RETURN
sudo iptables -t nat -A OUTPUT -d 172.16.0.0/12 -j RETURN
sudo iptables -t nat -A OUTPUT -d 192.168.0.0/16 -j RETURN
sudo iptables -t nat -A OUTPUT -d 198.18.0.0/15 -j RETURN
sudo iptables -t nat -A OUTPUT -d 224.0.0.0/4 -j RETURN
sudo iptables -t nat -A OUTPUT -d 240.0.0.0/4 -j RETURN

# Anything else should be redirected to port 12345

sudo iptables -t nat -A OUTPUT -p tcp -j REDIRECT --to-ports 12345

## dump

sudo tcpdump -i lo port 12345

journalctl -u redsocks
```

### Configuration

Create/edit `/etc/redsocks.conf`:

```
base {
    log_debug = off;
    log_info = on;
    log = "syslog:daemon";
    daemon = on;
    user = redsocks;
    group = redsocks;
    redirector = iptables;
}

redsocks {
    local_ip = 127.0.0.1;
    local_port = 12345;
    ip = 127.0.0.1;
    port = 8080;
    type = http-connect;
}

redsocks {
    local_ip = 127.0.0.1;
    local_port = 12346;
    ip = 127.0.0.1;
    port = 8080;
    type = http-relay;
}
```

Start redsocks:

```bash
sudo systemctl restart redsocks
sudo systemctl status redsocks

# Verify port
sudo netstat -tulnp | grep 12345
```
