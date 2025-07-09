# DNS Setup Guide for GTL Lab Email Authentication

## Overview
These DNS records are required for AWS SES email authentication for `noreply@gtl-lab.com`.

## Records to Add

### DKIM CNAME Records (Add all 3)
```
Record 1:
Type: CNAME
Name: 4nl2ndi5dun27qimwj6g2eqr6u7giyat._domainkey
Value: 4nl2ndi5dun27qimwj6g2eqr6u7giyat.dkim.amazonses.com

Record 2:
Type: CNAME
Name: sjxd5kchpulgxgmoj6aviy5cysuyrap6._domainkey
Value: sjxd5kchpulgxgmoj6aviy5cysuyrap6.dkim.amazonses.com

Record 3:
Type: CNAME
Name: f2wkwm5x33cwsldavoozo4n7x53saxt6._domainkey
Value: f2wkwm5x33cwsldavoozo4n7x53saxt6.dkim.amazonses.com
```

### MX Record
```
Type: MX
Name: noreply
Value: 10 feedback-smtp.us-east-2.amazonses.com
Priority: 10
```

### SPF TXT Record
```
Type: TXT
Name: noreply
Value: v=spf1 include:amazonses.com ~all
```

### DMARC TXT Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

## Important Notes
- Remove `.gtl-lab.com` from Name fields if your registrar adds it automatically
- DNS propagation can take up to 48 hours
- Don't include quotes in TXT values unless required by your registrar
- Test email sending after DNS propagation completes

## Verification
After adding records, you can verify them using:
```bash
# Check DKIM
nslookup -type=TXT 4nl2ndi5dun27qimwj6g2eqr6u7giyat._domainkey.gtl-lab.com

# Check SPF
nslookup -type=TXT noreply.gtl-lab.com

# Check DMARC
nslookup -type=TXT _dmarc.gtl-lab.com

# Check MX
nslookup -type=MX noreply.gtl-lab.com
```

## Next Steps
1. Add all DNS records to your domain registrar
2. Wait for DNS propagation (usually 1-4 hours)
3. Test email sending through Supabase
4. Monitor email deliverability in AWS SES console 