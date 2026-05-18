export function generateConfig(config) {
  const reportTypes = config.reportType === 'both'
    ? ['reading', 'spanish']
    : [config.reportType];

  return {
    district_oid: config.districtOid,
    email: config.email,
    output_dir: config.outputDir || '~/Documents/Istation Data',
    year: config.year,
    report_types: reportTypes,
    filename_pattern: config.filenamePattern,
    password_source: config.passwordSource === 'credfile' ? 'credfile' : config.passwordSource,
    log_file: (config.outputDir || '~/Documents/Istation Data') + '/downloader.log',
  };
}

export function configToJson(config) {
  return JSON.stringify(generateConfig(config), null, 2);
}
