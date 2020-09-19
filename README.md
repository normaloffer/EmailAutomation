﻿# EmailAutomation

## 📕======= Installing Postfix Mail Server =======

```
Please add A record for your server 
```
#### 1. Adding DNS Records

##### Note : Please replace domain and ip address


```
@         1800   IN      A      000.000.000.000

@         1800   IN      MX     10    mail.example.com.

www       1800   IN      A      000.000.000.000

mailbox   1800   IN      A      000.000.000.000

mail      1800   IN      CNAME  example.com.

@         1800   IN      TXT    "v=spf1 a mx ip4:000.000.000.000 ~all"

_dmarc    1800   IN      TXT    "v=DMARC1; p=none; rua=mailto:postmaster@example.com"

mail._domainkey    1800   IN      TXT    Past here the key after installtion

```

#### 2. Download Source 
```
cd ~
git clone https://github.com/zobayerhossainmamun/EmailAutomation

```

#### 3. Start installing
```
Please replace your configurations informations
```

```
chmod +x ~/EmailAutomation/setup.sh && ~/EmailAutomation/setup.sh
```

#### 4. You will get two email after complete installtion

```
postmaster@example.com | email000

```

#### 5. Manage your Mail Server Domains and Users

```
ACCESS URL : http://mailbox.example.com/admin

Please login with your gived email and password
```

