// LTI Launch Tester — LTI parameter building utilities
import { oauthEncode, generateNonce, generateUUID, hmacSha1Base64 } from './oauth.js';

/**
 * Build and sign LTI 1.0 parameters.
 * @param {object} fields - Form field values
 * @returns {{ params, postParams, baseString, signingKey, signature }}
 */
export function buildLti10Params(fields) {
  const { launchUrl, consumerKey, consumerSecret, userIdField, userIdValue, roles } = fields;

  const parsedUrl = new URL(launchUrl);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const resourceLinkId = generateUUID();
  const normalizedUrl =
    parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

  const params = {};
  for (const [k, v] of parsedUrl.searchParams.entries()) params[k] = v;
  params['lti_message_type']       = 'basic-lti-launch-request';
  params['lti_version']            = 'LTI-1p0';
  params['resource_link_id']       = resourceLinkId;
  params['oauth_consumer_key']     = consumerKey;
  params['oauth_nonce']            = nonce;
  params['oauth_signature_method'] = 'HMAC-SHA1';
  params['oauth_timestamp']        = timestamp;
  params['oauth_version']          = '1.0';
  params['user_id']                = userIdValue;
  if (userIdField !== 'user_id') params[userIdField] = userIdValue;
  params['roles'] = roles;

  const sortedEncoded = Object.entries(params)
    .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
    .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
  const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
  const signingKey  = oauthEncode(consumerSecret) + '&';
  const signature   = hmacSha1Base64(signingKey, baseString);
  const postParams  = Object.assign({}, params, { oauth_signature: signature });

  return { params, postParams, baseString, signingKey, signature };
}

/**
 * Build and sign LTI 1.2 parameters (superset of 1.0).
 * @param {object} fields - Form field values
 * @returns {{ params, postParams, baseString, signingKey, signature }}
 */
export function buildLti12Params(fields) {
  const {
    launchUrl, consumerKey, consumerSecret,
    userIdField, userIdValue, roles,
    givenName, familyName,
    contextId, contextLabel, contextTitle,
    tcGuid, tcPlatform,
    responseFormat, outcomesUrl,
  } = fields;

  const parsedUrl = new URL(launchUrl);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const resourceLinkId = generateUUID();
  const normalizedUrl =
    parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

  const params = {};
  for (const [k, v] of parsedUrl.searchParams.entries()) params[k] = v;
  params['lti_message_type']       = 'basic-lti-launch-request';
  params['lti_version']            = 'LTI-1p0';
  params['resource_link_id']       = resourceLinkId;
  params['oauth_consumer_key']     = consumerKey;
  params['oauth_nonce']            = nonce;
  params['oauth_signature_method'] = 'HMAC-SHA1';
  params['oauth_timestamp']        = timestamp;
  params['oauth_version']          = '1.0';
  params['user_id']                = userIdValue;
  if (userIdField !== 'user_id') params[userIdField] = userIdValue;
  params['roles'] = roles;

  if (givenName)  params['lis_person_name_given']  = givenName;
  if (familyName) params['lis_person_name_family'] = familyName;
  if (givenName && familyName) params['lis_person_name_full'] = givenName + ' ' + familyName;
  if (contextId)    params['context_id']    = contextId;
  if (contextLabel) params['context_label'] = contextLabel;
  if (contextTitle) params['context_title'] = contextTitle;
  if (contextId)    params['context_type']  = 'CourseSection';
  if (tcGuid)     params['tool_consumer_instance_guid'] = tcGuid;
  if (tcPlatform) params['tool_consumer_info_product_family_code'] = tcPlatform;
  if (responseFormat === 'xml') {
    params['lis_result_sourcedid'] = generateUUID();
    if (outcomesUrl) params['lis_outcome_service_url'] = outcomesUrl;
  }

  const sortedEncoded = Object.entries(params)
    .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
    .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
  const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
  const signingKey  = oauthEncode(consumerSecret) + '&';
  const signature   = hmacSha1Base64(signingKey, baseString);
  const postParams  = Object.assign({}, params, { oauth_signature: signature });

  return { params, postParams, baseString, signingKey, signature };
}
