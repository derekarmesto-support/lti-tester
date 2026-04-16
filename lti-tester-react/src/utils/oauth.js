// LTI Launch Tester — OAuth Utilities

export function oauthEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,  '%21').replace(/'/g,  '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

export function generateNonce() {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateUUID() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const h = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  return base64urlEncodeBytes(bytes);
}

export function base64urlEncodeBytes(bytes) {
  let b = '';
  bytes.forEach(byte => b += String.fromCharCode(byte));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function _sha1(msgBytes) {
  let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
  const len=msgBytes.length,bitLen=len*8;
  const padLen=((len%64)<56)?(56-len%64):(120-len%64);
  const padded=new Uint8Array(len+padLen+8);
  padded.set(msgBytes); padded[len]=0x80;
  const dv=new DataView(padded.buffer);
  dv.setUint32(padded.length-8,Math.floor(bitLen/0x100000000)>>>0,false);
  dv.setUint32(padded.length-4,bitLen>>>0,false);
  const rotl=(x,n)=>((x<<n)|(x>>>(32-n)))>>>0;
  const w=new Uint32Array(80);
  for(let off=0;off<padded.length;off+=64){
    const blk=new DataView(padded.buffer,off,64);
    for(let i=0;i<16;i++)w[i]=blk.getUint32(i*4,false);
    for(let i=16;i<80;i++)w[i]=rotl(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
    let a=h0,b=h1,c=h2,d=h3,e=h4;
    for(let i=0;i<80;i++){
      let f,k;
      if(i<20){f=((b&c)|(~b&d))>>>0;k=0x5A827999;}
      else if(i<40){f=(b^c^d)>>>0;k=0x6ED9EBA1;}
      else if(i<60){f=((b&c)|(b&d)|(c&d))>>>0;k=0x8F1BBCDC;}
      else{f=(b^c^d)>>>0;k=0xCA62C1D6;}
      const tmp=(rotl(a,5)+f+e+k+w[i])>>>0;
      e=d;d=c;c=rotl(b,30);b=a;a=tmp;
    }
    h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;
  }
  const out=new Uint8Array(20),ov=new DataView(out.buffer);
  ov.setUint32(0,h0,false);ov.setUint32(4,h1,false);
  ov.setUint32(8,h2,false);ov.setUint32(12,h3,false);
  ov.setUint32(16,h4,false);
  return out;
}

export function hmacSha1Base64(key, message) {
  const enc=new TextEncoder();
  let kb=enc.encode(key);
  const mb=enc.encode(message),B=64;
  if(kb.length>B)kb=_sha1(kb);
  const k=new Uint8Array(B);k.set(kb);
  const ipad=new Uint8Array(B),opad=new Uint8Array(B);
  for(let i=0;i<B;i++){ipad[i]=k[i]^0x36;opad[i]=k[i]^0x5C;}
  const inner=new Uint8Array(B+mb.length);
  inner.set(ipad);inner.set(mb,B);
  const ih=_sha1(inner);
  const outer=new Uint8Array(B+20);
  outer.set(opad);outer.set(ih,B);
  return btoa(String.fromCharCode(..._sha1(outer)));
}
