const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function buildCronLine(hour, minute, dayOfWeek) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const dayName = DAY_NAMES[dayOfWeek] || 'Monday';
  return [
    `# Istation downloader — every ${dayName} at ${h}:${m}`,
    `# Add to crontab with:  crontab -e`,
    `#`,
    `# Replace /path/to/downloader with the actual folder where you extracted the ZIP`,
    `${minute} ${hour} * * ${dayOfWeek} cd /path/to/downloader && python3 downloader.py >> ~/Documents/Istation\\ Data/cron.log 2>&1`,
  ].join('\n');
}

export function buildWindowsTaskXml(hour, minute, dayOfWeek) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const dayNum = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // Task Scheduler: Sun=1 … Sat=7
  const dayName = DAY_NAMES[dayOfWeek] || 'Monday';

  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Istation Data Downloader — runs every ${dayName} at ${h}:${m}</Description>
    <Author>Amira Learning Istation Tool</Author>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2025-01-01T${h}:${m}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <WeeksInterval>1</WeeksInterval>
        <DaysOfWeek>
          <${dayName} />
        </DaysOfWeek>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT4H</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>python</Command>
      <Arguments>downloader.py</Arguments>
      <!-- Update WorkingDirectory to the folder where you extracted the ZIP -->
      <WorkingDirectory>C:\\Users\\YourName\\Documents\\istation-downloader</WorkingDirectory>
    </Exec>
  </Actions>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
</Task>`;
}
