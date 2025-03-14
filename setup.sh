#!/bin/bash

if [[ $EUID -ne 0 ]]; then
	echo "Please run this script as root" 1>&2
	exit 1
fi

echo "Updating and Installing Dependicies"
apt-get update
read -p "Enter your mail server's domain: " -r primary_domain
read -p "Enter your bounce email address: " -r bounce_email

cp /root/EmailAutomation/postfix_queue_log.sh /var/postfix_queue_log.sh
chmod 777 /var/postfix_queue_log.sh

echo "Installing Dependicies"
apt-get install -qq -y dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd dovecot-sqlite sqlite3
echo "postfix postfix/main_mailer_type string 'Internet Site'" | debconf-set-selections
echo "postfix postfix/mailname string $primary_domain" | debconf-set-selections
apt-get install -qq -y postfix postgrey postfix-sqlite
apt-get install -qq -y opendkim opendkim-tools
apt-get install -qq -y opendmarc
apt-get install -qq -y mailutils

echo "Configuring Postfix"

cat <<-EOF > /etc/postfix/main.cf
notify_classes = bounce
bounce_notice_recipient = ${bounce_email}

# GENERAL SETTINGS
smtpd_banner = \$myhostname ESMTP \$mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no

# SMTP SETTINGS 
smtp_use_tls=yes
smtp_tls_security_level = may
smtp_tls_session_cache_database = btree:\${data_directory}/smtp_scache

# SMTPD SETTINGS 
smtpd_use_tls=yes
smtpd_tls_security_level = may
smtpd_tls_session_cache_database = btree:\${data_directory}/smtpd_scache
smtpd_tls_cert_file=/etc/letsencrypt/live/mail.${primary_domain}/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/mail.${primary_domain}/privkey.pem
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated,  reject_unauth_destination

# SASL SETTINGS
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
# VIRTUAL MAIL BOX AND LMTP SETTINGS
virtual_transport = lmtp:unix:private/dovecot-lmtp

# OTHER SETTINGS
myhostname = mail.${primary_domain}
myorigin = /etc/mailname
mydestination =  localhost.${primary_domain}, localhost
relayhost = 
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = all
message_size_limit=134217728

alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases

virtual_mailbox_domains=sqlite:/etc/postfix/virtual-mailbox-domains.cf
virtual_mailbox_maps=sqlite:/etc/postfix/virtual-mailbox-maps.cf
virtual_alias_maps=sqlite:/etc/postfix/virtual-alias-maps.cf

header_checks = regexp:/etc/postfix/header_checks

milter_protocol = 2
milter_default_action = accept
smtpd_milters = inet:localhost:12301
EOF

if [ ! -f /etc/postfix/header_checks ]; then
cat <<-EOF >>  /etc/postfix/header_checks
/Message-Id:\s+<(.*?)@mail.${primary_domain}>/ REPLACE Message-Id: <\$1...@${primary_domain}>
EOF
fi

postmap /etc/postfix/header_checks
postconf -M submission/inet="submission       inet       n       -       -       -       -       smtpd"
postconf -P submission/inet/syslog_name=postfix/submission
postconf -P submission/inet/smtpd_tls_security_level=may
postconf -P submission/inet/smtpd_sasl_auth_enable=yes
postconf -P submission/inet/smtpd_client_restrictions=permit_sasl_authenticated,reject

 ########################### CONFIGURING DKIM ###########################
echo "Configuring Opendkim"
cat <<-EOF >>  /etc/opendkim.conf
AutoRestart             Yes
AutoRestartRate         10/1h
UMask                   002
Syslog                  yes
SyslogSuccess           Yes
LogWhy                  Yes

Canonicalization        relaxed/simple

ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
KeyTable                refile:/etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable

Mode                    sv
PidFile                 /var/run/opendkim/opendkim.pid
SignatureAlgorithm      rsa-sha256

UserID                  opendkim:opendkim

Socket                  inet:12301@localhost
EOF

mkdir /etc/opendkim
mkdir /etc/opendkim/keys

cat <<-EOF >> /etc/opendkim/TrustedHosts
127.0.0.1
localhost
192.168.0.1/24

*.${primary_domain}
EOF

cat <<-EOF >> /etc/opendkim/KeyTable
mail._domainkey.${primary_domain} ${primary_domain}:mail:/etc/opendkim/keys/${primary_domain}/mail.private
EOF

cat <<-EOF >> /etc/opendkim/SigningTable
*@${primary_domain} mail._domainkey.${primary_domain}
EOF

mkdir /etc/opendkim/keys/$primary_domain

cd /etc/opendkim/keys/$primary_domain
sudo opendkim-genkey -s mail -d $primary_domain
sudo chown opendkim:opendkim mail.private
########################### CONFIGURING DKIM ###########################

########################### CONFIGURING DMERC ###########################
echo "Configuring opendmarc"
cat <<-EOF > /etc/opendmarc.conf
AuthservID ${primary_domain}
PidFile /var/run/opendmarc.pid
RejectFailures false
Syslog true
TrustedAuthservIDs ${primary_domain}
Socket  inet:54321@localhost
UMask 0002
UserID opendmarc:opendmarc
IgnoreHosts /etc/opendmarc/ignore.hosts
HistoryFile /var/run/opendmarc/opendmarc.dat
EOF

mkdir "/etc/opendmarc/"
echo "localhost" > /etc/opendmarc/ignore.hosts
chown -R opendmarc:opendmarc /etc/opendmarc

echo 'SOCKET="inet:54321"' >> /etc/default/opendmarc

########################### CONFIGURING DMERC ###########################

db_path=/var/mail/mail_db.sqlite
# Create an empty database if it doesn't yet exist.
if [ ! -f $db_path ]; then
	echo Creating new user database: $db_path;
  echo "CREATE TABLE admins (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid TEXT NOT NULL DEFAULT 0, firstname TEXT DEFAULT NULL,lastname TEXT DEFAULT NULL, email TEXT DEFAULT NULL,password TEXT DEFAULT NULL,status INT NOT NULL DEFAULT 0, created_at TEXT DEFAULT NULL);" | sqlite3 $db_path;
	echo "CREATE TABLE domains (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL);" | sqlite3 $db_path;
	echo "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, domain_id INT NOT NULL,password TEXT NOT NULL,email TEXT NOT NULL UNIQUE);" | sqlite3 $db_path;
	echo "CREATE TABLE aliases (id INTEGER PRIMARY KEY AUTOINCREMENT,domain_id INT NOT NULL ,source TEXT NOT NULL,destination TEXT NOT NULL);" | sqlite3 $db_path;
  echo "INSERT INTO domains(id ,name)VALUES('1', '$primary_domain');" | sqlite3 $db_path;
  echo "INSERT INTO users (id, domain_id,password,email) VALUES (1, '1', 'email000', 'postmaster@${primary_domain}');" | sqlite3 $db_path;
  echo "INSERT INTO users (id, domain_id,password,email) VALUES (2, '1', 'email000', 'bounces@${primary_domain}');" | sqlite3 $db_path;
  echo "INSERT INTO admins (id, uuid, firstname, lastname, email, password, status, created_at) VALUES (1, 0, 'Main', 'Admin', 'postmaster@${primary_domain}', 'email000', 1, NULL);" | sqlite3 $db_path;
fi

cat > /etc/postfix/virtual-mailbox-domains.cf << EOF;
dbpath=$db_path
query = SELECT 1 FROM domains WHERE name='%s'
EOF

cat > /etc/postfix/virtual-mailbox-maps.cf << EOF;
dbpath=$db_path
query = SELECT 1 FROM users WHERE email='%s'
EOF

cat > /etc/postfix/virtual-alias-maps.cf << EOF;
dbpath=$db_path
query = SELECT destination FROM aliases WHERE source='%s'
EOF

# Have Dovecot query our database, and not system users, for authentication.
sudo sed -i 's/auth_mechanisms = plain/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
sed -i "s/#*\(\!include auth-system.conf.ext\)/#\1/"  /etc/dovecot/conf.d/10-auth.conf
sed -i "s/#\(\!include auth-sql.conf.ext\)/\1/"  /etc/dovecot/conf.d/10-auth.conf

# Specify how the database is to be queried for user authentication (passdb)
# and where user mailboxes are stored (userdb).
cat > /etc/dovecot/conf.d/auth-sql.conf.ext << EOF;
passdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}
userdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}
EOF
sudo sed -i 's/ssl = yes/ssl = required/' /etc/dovecot/conf.d/10-ssl.conf

sudo sed -i 's/ssl_cert = <\/etc\/dovecot\/private\/dovecot.pem/ssl_cert = <\/etc\/letsencrypt\/live\/mail.'$primary_domain'\/fullchain.pem/' /etc/dovecot/conf.d/10-ssl.conf
sudo sed -i 's/ssl_key = <\/etc\/dovecot\/private\/dovecot.key/ssl_key = <\/etc\/letsencrypt\/live\/mail.'$primary_domain'\/privkey.pem/' /etc/dovecot/conf.d/10-ssl.conf

sudo sed -i '/\!include conf\.d\/\*\.conf/s/^#//' /etc/dovecot/dovecot.conf
echo "protocols = imap lmtp pop3" >> /etc/dovecot/dovecot.conf
sudo sed -i 's/mail_location = mbox:~\/mail:INBOX=\/var\/mail\/%u/mail_location = maildir:\/var\/vmail\/vhosts\/%d\/%n/' /etc/dovecot/conf.d/10-mail.conf
sudo sed -i 's/#mail_location = mbox:~\/mail:INBOX=\/var\/mail\/%u/mail_location = maildir:\/var\/vmail\/vhosts\/%d\/%n/' /etc/dovecot/conf.d/10-mail.conf
sudo sed -i 's/#mail_privileged_group =/mail_privileged_group = mail/' /etc/dovecot/conf.d/10-mail.conf
sudo sed -i 's/#disable_plaintext_auth = yes/disable_plaintext_auth = yes/' /etc/dovecot/conf.d/10-auth.conf

# Configure the SQL to query for a user's metadata and password.
cat > /etc/dovecot/dovecot-sql.conf.ext << EOF;
driver = sqlite
connect = $db_path
default_pass_scheme = PLAIN
password_query = SELECT email as user, password FROM users WHERE email='%u';
user_query = SELECT '/var/vmail/vhosts/%d/%n' as home, 'maildir:/var/vmail/vhosts/%d/%n' as mail, 5000 AS uid, 5000 AS gid FROM users WHERE email = '%u'
EOF

mkdir -m 777 /var/vmail
mkdir -m 777 /var/vmail/vhosts
mkdir -m 777 /var/vmail/vhosts/$primary_domain
mkdir -m 777 /var/vmail/vhosts/$primary_domain
groupadd -g 5000 vmail

useradd -r -g vmail -u 5000 vmail -d /var/mail/vhosts -c "postmaster"
useradd -r -g vmail -u 5000 vmail -d /var/mail/vhosts -c "bounces"
chown -R vmail:vmail /var/vmail/vhosts/
mkdir -m 777 /var/vmail/vhosts/$primary_domain/postmaster
mkdir -m 777 /var/vmail/vhosts/$primary_domain/bounces


# Have Dovecot provide an authorization service that Postfix can access & use.
cat > /etc/dovecot/conf.d/99-local-auth.conf << EOF;
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
EOF

chown -R vmail:dovecot /etc/dovecot
chmod -R o-rwx /etc/dovecot

cat <<-EOF >> /etc/dovecot/conf.d/10-master.conf
service imap-login {
  inet_listener imap {
    port = 0
  }
  inet_listener imaps {
    port = 993
    ssl = yes
  }
}
service pop3-login {
  inet_listener pop3 {
    #port = 110
  }
  inet_listener pop3s {
    port = 995
    ssl = yes
  }
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}

service imap {
}

service pop3 {
}

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user=postfix
    group=postfix
  }

  unix_listener auth-userdb {
   mode = 0600
   user = vmail
   #group =
  }
  # Auth process is run as this user.
  user = dovecot
}

service auth-worker {
  user = vmail
}

service dict {
  unix_listener dict {
  }
}
EOF

sudo add-apt-repository -y ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot -y
sudo certbot certonly --standalone --preferred-challenges http -d mail.$primary_domain -m postmaster@$primary_domain -n --agree-tos --redirect
service postfix restart
service opendkim restart
service dovecot restart

apt-get install -y nginx
curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
apt-get install -y nodejs
cp -r  /root/EmailAutomation /var/www 

echo '
server {
    listen 80;
    listen [::]:80;
    server_name mailbox.'$primary_domain' www.mailbox.'$primary_domain';

    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    location / {
        proxy_pass "http://localhost:3000/";
    }
}

' > /etc/nginx/conf.d/mailbox.$primary_domain.conf
service nginx restart
cd /var/www/EmailAutomation/mail_server
npm install
npm install pm2 -g
pm2 start bin/www


input="/etc/opendkim/keys/$primary_domain/mail.txt"
while IFS= read -r line
do
  echo "$line"
done < "$input"

echo "######## MAIL SERVER HAS BEEN INSTALLED SUCCESSFULLY ########"