/*
  reverse-proxy.js: Example of reverse proxying (with HTTPS support)
  Copyright 2022 Sadam·Sadik <1903249375@qq.com>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var http = require('http'), net = require('net'), httpProxy = require('http-proxy'), url = require('url')

var proxy = httpProxy.createServer();
proxy.on('proxyReq', function (proxyReq, req, res, options) {
    // console.log("proxying for", req.url);
    //set headers
    // console.log('proxy request forwarded succesfully');
});

proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    res.end('Something went wrong. And we are reporting a custom error message.');
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    var contentType = proxyRes.headers['content-type'];
    var body = "", obj
    proxyRes.on('data', function (c) {
        body += c;
    });
    proxyRes.on('end', function (c) {
        if (contentType === "application/json" || contentType === "text/json") {
            try {
                obj = JSON.parse(body);
                console.log("Status:[", proxyRes.statusCode, "], Method:[", req.method, "] Content-Type:[", contentType, "], url:[", req.url, "]", "Body:[", obj, "]")
                //TODO：处理相应体内容
            } catch (err) {
                // return send (err, 400)
                console.log("Status:[", proxyRes.statusCode, "], Method:[", req.method, "] Content-Type:[", contentType, "], url:[", req.url, "], ProxyRes Json Parse Err:[", err, "]")
            }
        } else {
            console.log("Status:[", proxyRes.statusCode, "], Method:[", req.method, "] Content-Type:[", contentType, "], url:[", req.url, "]")
        }
        // store.set(url, obj)
        // send({ok: true})
    })
});


proxy.on('response', function (c) {
    console.log("response:", c)
});

proxy.on('message', function (msg) {
    console.log("Msg:", msg);
})
proxy.on('end', function (c) {
    //代理完成回调
})


var server = http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url);
    //parsedUrl: Url {
    //   protocol: 'http:',
    //   slashes: true,
    //   auth: null,
    //   host: '124.156.199.31:9888',
    //   port: '9888',
    //   hostname: '124.156.199.31',
    //   hash: null,
    //   search: null,
    //   query: null,
    //   pathname: '/files',
    //   path: '/files',
    //   href: 'http://124.156.199.31:9888/files'
    // }
    var target = {host: parsedUrl.hostname, port: parsedUrl.port};
    // console.log('Receiving reverse proxy request for:', req.url, "=====>>", target);
    proxy.web(req, res, {target: target, secure: false})
}).listen(8080);
server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
});

server.on('connect', function (req, socket) {
    console.log('Connect to:' + req.url);

    var serverUrl = url.parse('https://' + req.url);

    var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
        socket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node-Proxy\r\n' +
            '\r\n');
        srvSocket.pipe(socket);
        socket.pipe(srvSocket);
    });
});
