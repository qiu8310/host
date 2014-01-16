#!/usr/bin/env node
/*
	Win 64 位系统测试 “node dns 的 lookup 功能” 与 “系统命令行自带的 nslookup 命令” 的不同点

 	注意：
 	 1. node 的 dns.lookup(domain, function (err, ip) {}) 
 		回调中的 ip 总是第一个解析到的 ip（v4或v6），所以下面测试用例中可能你们得到的 ip 会和我的不同
	 2. 为了测试，请先临时清空本地 HOST 文件中的所有内容
	 3. 准备 chrome 浏览器，并打开 URL： chrome://net-internals/#dns （上面有个按钮，可以清空浏览器的DNS缓存）
	 4. 清空系统本地DNS缓存可以使用CMD命令， ipconfig /flushdns；查看是否已清空，可以使用命令 ipconfig /displaydns
	
	预先实验：（TODO：这个实验有问题，同时清空了本地和浏览器的DNS，仍然可以访问百度？）
	 1. CMD运行： ipconfig /flushdns		=> 清空系统 DNS 缓存
	 2. 用 chrome 访问 baidu.com 		=> 生成 baidu.com 的 DNS 缓存（同时在本地和浏览器上都生成了DNS缓存）
	 3. 写入 HOST: 					
	 		127.0.0.1 baidu.com
	 		127.0.0.1 www.baidu.com
	 4. 清空 chrome 浏览器缓存
	 5. 再访问 baidu.com，正常			=> 还是可以正常访问，说明用了本地的 DNS 缓存，因为第4步清空了浏览器的 DNS
	 6. CMD运行： ipconfig /flushdns 	=> 清空本地的 DNS 缓存
	 7. 再访问 baidu.com，正常			=> 虽然清空了本地 DNS，但第5步生成了浏览器DNS缓存，所以还是可以访问
	 8. 同时清空浏览器和本地缓存，再访问	=> 由于没用任何缓存，就用了 HOST 文件的设置，所以此处就访问不了

	 这实验说明：
	 	DNS缓存可以在系统本地，也可以在浏览器中，浏览器首先会根据自己的DNS缓存来解析域名，
	 	如果自己没有，就会去系统DNS缓存中查找，如果也没有，则会去HOST文件中查找，如果
	 	又没有，最后才会去指定的远程域名服务器中查找。

	 	chrome浏览器DNS查找过程：
	 		浏览器DNS缓存 -> 系统本地DNS缓存 -> 系统HOST文件 -> 系统指定的域名服务器


	NODE DNS 模块实验
	 1. 清空HOST文件、清空浏览器DNS缓存、清空当前系统DNS缓存
	 2. 在 chrome 中访问 baidu.com，生成了系统和浏览器的DNS缓存
	 3. CMD运行：nslookup baidu.com，可以得到三个对应的IP：220.181.111.86 123.125.114.144 220.181.111.85
	 4. 执行此脚本，会得到上面三个中的一个IP，我这是：123.125.114.144 （“注意”事项的第1点有解释）
	 5. 在HOST文件中写入两条记录
	 		127.0.0.1 baidu.com
	 		127.0.0.1 www.baidu.com
 	 6. 再运行此脚本，得到IP即变成了 127.0.0.1，但此时浏览器仍然可以正常访问 baidu.com；
 	 	清空浏览器缓存，还是可以正常访问；再同时清空本地和系统缓存，才不能访问了。另外
 	 	中间不管在哪个步骤运行 nslookup baidu.com，得到的结果都是一样，上面三个IP。

 	 说明：
 	 	1. node的这个dns模块并不会使用系统的DNS缓存，而是直接使用HOST文件，或远程域名服务器
 	 	   node不像浏览器，不会去保存自己的DNS缓存
		2. CMD中的 nslookup [domain] 永远都是从域名服务器中去取，不会使用HOST文件

*/

var dns = require('dns')

/*
 *	dns.lookup 先会查找本地HOST文件，没找到才会使用域名服务器
 * 	此方法调用的是 getaddrinfo 函数，而该模块下的其它所有方法都是使用 C-Area，所以 dns.lookup 如果查找远程域名服务器的话会比其它方法慢
 *  用户使用 net.connect(80, 'google.com') 或者 http.get() 及 http.request() 时，使用的就是 dns.lookup 方法
 */
dns.lookup('baidu.com', function (err, addresses) {
	if (err) throw err;
	console.log('dns.lookup: ' + addresses);
});

/**
 *	dns.resolve4 不会使用本地HOST文件，永远使用的是域名服务器，就像 window 的命令 nslookup
 */
dns.resolve4('baidu.com', function (err, addresses) {
	if (err) throw err;
	console.log('dns.resolve4: ' + JSON.stringify(addresses));
});