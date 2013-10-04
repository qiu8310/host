module.exports = (function () {
	'use strict';
	var self,
		rIPv4	= /^\d{1,3}(\.\d{1,3}){3}$/,
		rIPv6	= /^[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7}$/,
		rIPv6S	= /^[0-9a-fA-F\:]+$/,
		rDomain = /^\.?[\w]+(\.[\w]+)+$/,
		MAX_GROUP_NAME_LENGTH = 30,
		EOL		= '\r\n',
		fs		= require('fs'),
		path	= require('path');

	var HOSTS_PATH = process.platform !== 'win32' ? '/etc/hosts' :
						process.env.windir + path.sep + ['System32', 'drivers', 'etc', 'hosts'].join(path.sep),
		HOSTS = [],
		HOST_HASH_DOMAIN	= {},
		HOST_HASH_IP		= {},
		HOST_HASH_GROUP		= {};

	HOST_HASH_GROUP['default'] = []; // take the first place


	function isIP		(str) { return typeof str === 'string' ? (rIPv4.test(str) ? true : rIPv6S.test(str)) : false; }
	function isDomain	(str) { return typeof str === 'string' ? str === 'localhost' || rDomain.test(str) : false; }
	function isGroup	(str) { return typeof str !== 'string' ? false : str.length <= MAX_GROUP_NAME_LENGTH && !isDomain(str) && !isIP(str.split(' ').shift()); }
	function formatGroup(str) { return str.trim().toLowerCase().replace(/[\s+|-]/g, '_'); }
	function addHost	(host) {
		var domain = host.domain, ip = host.ip, group = formatGroup(host.group);
		if (!HOST_HASH_DOMAIN[domain]) {
			HOSTS.push(host);

			HOST_HASH_DOMAIN[domain] = host;

			if (!HOST_HASH_IP[ip]) HOST_HASH_IP[ip] = [];
			HOST_HASH_IP[ip].push(host);
		
			if (!HOST_HASH_GROUP[group]) HOST_HASH_GROUP[group] = [];
			HOST_HASH_GROUP[group].push(host);
		}
	}
	function updateHost	(ip, domain, group, enabled, comment) {
		if (HOST_HASH_DOMAIN[domain]) {
			HOST_HASH_DOMAIN[domain].ip = ip;
			if (typeof group !== 'undefined') {
				var oldg = HOST_HASH_DOMAIN[domain].group,
					newg = formatGroup(group || 'default');
				if (oldg !== newg) {
					delHost(HOST_HASH_DOMAIN[domain]);
					addHost(new Host(ip, domain, group, enabled, comment));
					return ;
				}
			}
			if (typeof enabled !== 'undefined') HOST_HASH_DOMAIN[domain].enabled = !!enabled;
			if (typeof comment !== 'undefined') {
				comment = comment && comment.trim() || '';
				HOST_HASH_DOMAIN[domain].comment = comment === '' ? '' : (comment.charAt(0) === '#' ? comment : '# ' + comment);
			}
		} else {
			addHost(new Host(ip, domain, group, enabled, comment));
		}
	}
	function delHost (host) {
		if (!host) return ;
		var domain = host.domain, ip = host.ip, group = formatGroup(host.group);
		HOST_HASH_DOMAIN[domain] = null;
		delete HOST_HASH_DOMAIN[domain];

		[HOST_HASH_GROUP[group], HOST_HASH_IP[ip], HOSTS].forEach(function (hosts) {
			if (hosts && hosts.length > 0) {
				for (var i=hosts.length - 1; i>=0; i--) {
					if (hosts[i]['domain'] === domain) {
						hosts.splice(i, 1);
						break;
					}
				}
			}
		});
	}


	function Host (ip, domain, group, enabled, comment) {
		this.ip = ip;
		this.domain = domain;
		this.group = group || 'default';
		this.enabled = typeof enabled === 'undefined' ? true : !!enabled;
		comment = comment && comment.trim() || '';
		this.comment = comment === '' ? '' : (comment.charAt(0) === '#' ? comment : '# ' + comment);
	}
	Host.prototype = {
		formatIp: function (ip) {
			var standard = 15, i, len = ip.length;
			for (i=15-len; i>0; i--) {
				ip += ' ';
			}
			return ip;
		},
		toString: function () {
			return (this.enabled ? '  ' : '  # ') +
				this.formatIp(this.ip) + ' \t\t' + this.domain +
				(this.comment ? ' \t\t' + this.comment : '');
		}
	};

	/**
	 *	get hosts in System hosts file
	 */
	(function init () {
		var lines, group;
		try {
			lines = fs.readFileSync(HOSTS_PATH, {encoding: 'utf8'});
		} catch (err) { throw err; }

		lines.split(/[\r]\n/).forEach(function (line, index, self) {
			var parts, host, ip, domain, enabled, comment, commentIndex;

			line = line.trim();
			if (!line) {
				group = 'default';
				return ;
			}
			if (line.charAt(0) === '#') {
				line = line.substr(1).trim();
				if (isGroup(line)) {
					group = line;
					return ;
				} else {
					enabled = false;
				}
			}

			commentIndex = line.indexOf('#');
			if (commentIndex >= 0) {
				comment = line.substr(commentIndex);
				line = line.substr(0, commentIndex);
			}
			parts = line.trim().split(/\s+/);
			ip = parts.shift();
			
			if (!isIP(ip)) {
				return ;
			}

			while(domain = parts.shift()) {
				if (!isDomain(domain)) {
					return ;
				}

				host = new Host(ip, domain, group, enabled, comment);

				// save
				addHost(host);

			}
		});
	})();

	function writeToHostsFile () {
		var group, hosts, lines = [], push = function (host) { lines.push(host.toString()); } ;
		for (group in HOST_HASH_GROUP) {
			hosts = HOST_HASH_GROUP[group];
			if (hosts.length === 0) continue;
			lines.push('# ' + hosts[0]['group']);
			hosts.forEach(push);
			lines.push(EOL + EOL);
		}

		fs.writeFileSync(HOSTS_PATH, lines.join(EOL), {encoding: 'utf8', flag: 'w'});
	}
	writeToHostsFile();

	self = {
		Host: Host,
		isIP: isIP,
		isDomain: isDomain,
		isGroup: isGroup,
		formatGroup: formatGroup,

		get : function () {
			var matches = [], args = Array.prototype.slice.call(arguments, 0), push = function (host) { matches.push(host); };

			args.forEach(function (arg) {
				if (HOST_HASH_DOMAIN[arg]) {
					push(HOST_HASH_DOMAIN[arg]);
				}

				if (HOST_HASH_IP[arg]) {
					HOST_HASH_IP[arg].forEach(push);
				}

				arg = formatGroup(arg);
				if (HOST_HASH_GROUP[arg]) {
					HOST_HASH_GROUP[arg].forEach(push);
				}
			});

			return matches;
		},

		set : function (ip, domain, group, enabled, comment) {
			var host;

			if (! isIP(ip)) {
				throw new Error('illegal IP adress: ' + ip);
			}

			if (! isDomain(domain)) {
				throw new Error('illegal domain: ' + domain);
			}

			if (enabled === '0' || enabled === 'false') {
				enabled = false;
			}

			updateHost(ip, domain, group, enabled, comment);
			writeToHostsFile();
		},

		del : function () {
			self.get.apply(self, Array.prototype.slice.call(arguments, 0)).forEach(function (host) {
				delHost(host);
			});
			writeToHostsFile();
		},

		enable:   function () {
			self.get.apply(self, Array.prototype.slice.call(arguments, 0)).forEach(function (host) {
				host.enabled = true;
			});
			writeToHostsFile();
		},
		
		disable:  function () {
			self.get.apply(self, Array.prototype.slice.call(arguments, 0)).forEach(function (host) {
				host.enabled = false;
			});
			writeToHostsFile();
		},
		
		ip : function (oldIp, newIp) {
			var hosts, host;
			if (!isIP(oldIp) || !isIP(newIp)) {
				throw new Error('illegal IP address');
			}
			hosts = HOST_HASH_IP[oldIp];
			if (!hosts || hosts.length === 0) return ;
			hosts.forEach(function (host) { host.ip = newIp; });
			writeToHostsFile();
		},

		loadSmarthosts: function () {
			var url = 'https://smarthosts.googlecode.com/svn/trunk/hosts';
			// TODO
		}
	};

	return self;
})();

	