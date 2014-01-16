#!/usr/bin/env node
var host = require('../host'),
	http = require('http'),
	dns  = require('dns');
		
var hosts = [
	{ip: '10.81.64.22', domain: 's0.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's1.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's2.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.20', domain: 's3.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'},
	{ip: '10.81.64.21', domain: 's4.apptuan.bdimg.com', test: '/static/mobile/common/lib/base_a02dbab9.js'}
];

// 设置颜色
var colors = {
        red:    ['\x1B[31m', '\x1B[39m'],
        green:  ['\x1B[32m', '\x1B[39m'],
        blue:   ['\x1B[34m', '\x1B[39m'],
        white:  ['\x1B[37m', '\x1B[39m'],
        gray:   ['\x1B[90m', '\x1B[39m']
    };
function c(str, color) { return colors[color][0] + str + colors[color][1]; }


function test (testHost, next) {
	if (!testHost) return ;
	host.del('test_dns_group');
	host.set(testHost.ip, testHost.domain, 'test_dns_group', true);
	process.stdout.write(c('Test domain ' + testHost.domain + ', ip ' + testHost.ip + '\t\t', 'gray'));

	var dnslookupTimes = 0, dnslookup;
	dnslookup = function (domain, expectIp, cb) {
		// 最多重试三次
		if (dnslookupTimes >= 3) {
			process.stdout.write(c('dnslookup warn: tried dnslookup 3 times\r\n', 'blue'));
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

	// DNS 解析成功，开始测试对应的资源是否存在
	dnslookup(testHost.domain, testHost.ip, function (err) {
		var nexted = false;

		req = http.request({
			hostname: testHost.domain,
			port: 80,
			path: testHost.test,
			method: 'HEAD'
		}, function (res) {
			if (nexted) return ;
			nexted = true;
			if (res.statusCode === 200) {
				process.stdout.write(c('ok\r\n', 'green'));
				next();
			} else {
				process.stdout.write(c('request warn: ' + 'Status code ' + res.statusCode + '\r\n', 'blue'));
				next();
			}
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

(function (hosts) {
	function next () {
		test(hosts.shift(), next);
	}
	next();
})(hosts);

