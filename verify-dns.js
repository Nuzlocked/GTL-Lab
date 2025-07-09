const dns = require('dns');

const domain = 'gtl-lab.com';
const subDomain = 'noreply.gtl-lab.com';

// DKIM records to check
const dkimRecords = [
  '4nl2ndi5dun27qimwj6g2eqr6u7giyat._domainkey.gtl-lab.com',
  'sjxd5kchpulgxgmoj6aviy5cysuyrap6._domainkey.gtl-lab.com',
  'f2wkwm5x33cwsldavoozo4n7x53saxt6._domainkey.gtl-lab.com'
];

function checkDNSRecord(hostname, recordType) {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, recordType, (err, records) => {
      if (err) {
        resolve({ hostname, recordType, status: 'NOT FOUND', error: err.message });
      } else {
        resolve({ hostname, recordType, status: 'FOUND', records });
      }
    });
  });
}

async function verifyDNSRecords() {
  console.log('🔍 Verifying DNS records for GTL Lab email authentication...\n');

  // Check DKIM CNAME records
  console.log('📧 Checking DKIM records:');
  for (const record of dkimRecords) {
    const result = await checkDNSRecord(record, 'CNAME');
    if (result.status === 'FOUND') {
      console.log(`✅ ${record} → ${result.records[0]}`);
    } else {
      console.log(`❌ ${record} → ${result.error}`);
    }
  }

  // Check SPF record
  console.log('\n🛡️ Checking SPF record:');
  const spfResult = await checkDNSRecord(subDomain, 'TXT');
  if (spfResult.status === 'FOUND') {
    const spfRecord = spfResult.records.find(record => record.includes('v=spf1'));
    if (spfRecord) {
      console.log(`✅ SPF: ${spfRecord}`);
    } else {
      console.log(`❌ SPF record not found in TXT records`);
    }
  } else {
    console.log(`❌ SPF: ${spfResult.error}`);
  }

  // Check DMARC record
  console.log('\n🔒 Checking DMARC record:');
  const dmarcResult = await checkDNSRecord(`_dmarc.${domain}`, 'TXT');
  if (dmarcResult.status === 'FOUND') {
    const dmarcRecord = dmarcResult.records.find(record => record.includes('v=DMARC1'));
    if (dmarcRecord) {
      console.log(`✅ DMARC: ${dmarcRecord}`);
    } else {
      console.log(`❌ DMARC record not found in TXT records`);
    }
  } else {
    console.log(`❌ DMARC: ${dmarcResult.error}`);
  }

  // Check MX record
  console.log('\n📬 Checking MX record:');
  const mxResult = await checkDNSRecord(subDomain, 'MX');
  if (mxResult.status === 'FOUND') {
    console.log(`✅ MX: ${mxResult.records.map(r => `${r.priority} ${r.exchange}`).join(', ')}`);
  } else {
    console.log(`❌ MX: ${mxResult.error}`);
  }

  console.log('\n🎉 DNS verification complete!');
  console.log('If all records show ✅, your email authentication is properly configured.');
  console.log('If any show ❌, please check your DNS settings and wait for propagation.');
}

verifyDNSRecords().catch(console.error); 