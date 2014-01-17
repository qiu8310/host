#!/usr/bin/env node
var host = require('../host'),
	http = require('http'),
	dns  = require('dns');
		
var hosts = [

	{ip: '10.81.64.20', domain: 's0.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.22', domain: 's0.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's1.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's2.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's3.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.21', domain: 's4.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},

	{ip: '165.225.133.152', domain: 'nodejs.org', test: '/api/http.html'},
	{ip: '165.225.133.150', domain: 'nodejs.org', test: '/api/xxxx.html'},
	{ip: '165.225.133.150', domain: 'nodejs.org', test: '/api/http.html'},
	{ip: '165.225.133.152', domain: 'nodejs.org', test: '/api/http.html'}
];

// 设置颜色
var colors = {
        red:    ['\x1B[31m', '\x1B[39m'], 	// for error
        green:  ['\x1B[32m', '\x1B[39m'],	// for success
        yellow: ['\x1B[33m', '\x1B[39m'], 	// for warn
        gray:   ['\x1B[90m', '\x1B[39m'] 	// for text
    };
function c(str, color) { return colors[color][0] + str + colors[color][1]; }


function test (testHost, next) {
	// 先删除之前用过的 host
	host.del('test_dns_group');

	// 测试完成
	if (!testHost) return;
	
	// 添加当前域名及IP到 host 文件中
	host.set(testHost.ip, testHost.domain, 'test_dns_group', true);
	process.stdout.write(c(' ' + testHost.ip + ' ' + testHost.domain + ' ' + testHost.test + '\t\t', 'gray'));

	var dnslookupTimes = 0, dnslookup;

	// dns 查询下，获取当前 域名的 ip，看其是否和设置的相同，相同则表示设置成功
	// 不同的话就稍等500ms再试，最多重试三次
	dnslookup = function (domain, expectIp, cb) {
		if (dnslookupTimes >= 3) {
			process.stdout.write(c('dnslookup warn: tried dnslookup 3 times\r\n', 'yellow'));
			next();
		} else {
			dns.lookup(domain, function (err, addresses) {
				if (err) {
					process.stdout.write(c('dnslookup fail: ' + err.code + '\r\n', 'red'));
					next();
				} else {
					if (addresses === expectIp) {
						cb();
					} else {
						dnslookupTimes++;
						setTimeout(function () {dnslookup(domain, expectIp, cb)}, 500);
					}
				}
			});
		}
	};

	// DNS 解析成功，开始用 http.request 去请求指定的资源，以验证此域名是否有用
	dnslookup(testHost.domain, testHost.ip, function (err) {
		var nexted = false, timeout = 2500;
		req = http.request({
			hostname: testHost.domain,
			port: 80,
			path: testHost.test,
			method: 'HEAD'
		}, function (res) {
			if (nexted) return ;
			nexted = true;

			// 结束 socket 连接
			res.socket.end();

			if (res.statusCode === 200) {
				process.stdout.write(c('ok\r\n', 'green'));
				next();
			} else {
				process.stdout.write(c('request warn: ' + 'Status code ' + res.statusCode + '\r\n', 'yellow'));
				next();
			}
		});

		req.setTimeout(timeout, function () {
			if (nexted) return ;
			nexted = true;

			req.abort();
			process.stdout.write(c('request warn: ' + 'timeout, ' + timeout + ' ms used\r\n', 'yellow'));
			next();
		});

		req.on('error', function (err) {
			if (nexted) return ;
			nexted = true;
			process.stdout.write(c('request fail: ' + err.code + '\r\n', 'red'));
			next();
		});
		req.end();
	});
}

//test(hosts.shift(), function () {});
(function () { test(hosts.shift(), arguments.callee); })();
