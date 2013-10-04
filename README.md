# host

windows host file manage

	usage:  host <command> <params> [options]
	
	    command:        get | set | del | enable | disable | ip
	
	    params:         [ip string] [domain string] [group string]
	
	    options:        -h | -c comment | -e isEnabled
	
	example:
	    host -h                                 # show this help
	
	    host get 127.0.0.1                      # get ip(127.0.0.1)'s host
	    host get plus.google.com default        # get domain(plus.google.com) and group(default)'s host
	    host get 127.0.0.1 192.168.1.101        # get ip(127.0.0.1) and ip(192.168.1.101)'s host
	
	    host del 127.0.0.1
	    host del 127.0.0.1 192.168.1.101
	    host del "default" test.com
	
	    host set <domain> <ip> [group] [-e enabled] [-c comment]
	    host set test.com 127.0.0.1 "personal use" -e true -c "this is comment"
	
	    host enable 127.0.0.1
	    host enable test.com "google group" "personal use"
	    host disable 127.0.0.1 192.168.1.102
	
	    host ip <old ip> <new ip>               # change all <old ip> to <new ip>
	    host ip 192.168.1.101 192.168.1.102