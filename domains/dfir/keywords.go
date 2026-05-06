package dfir

// DFIR keyword sets used by the classify stage. These replace PayGuard's
// finance-domain keywords (pay, transfer, wallet, etc.) with DFIR-domain
// equivalents.

// ArtifactKeywords help map a free-text finding into an ArtifactType.
var ArtifactKeywords = map[ArtifactType][]string{
	ArtifactMFTRecord: {
		"mft", "$mft", "master file table", "filesystem record",
	},
	ArtifactPrefetch: {
		"prefetch", ".pf", "prefetch file", "execution prefetch",
	},
	ArtifactAmcache: {
		"amcache", "amcache.hve", "compatibility cache", "shimcache",
	},
	ArtifactRegistryKey: {
		"registry", "regkey", "hive", "ntuser", "software\\",
		"hkey_local_machine", "hkey_current_user", "run key",
	},
	ArtifactEventLog: {
		"event log", "evtx", ".evtx", "windows event", "security.evtx",
		"system.evtx", "application.evtx",
	},
	ArtifactBrowserHistory: {
		"browser history", "history.db", "places.sqlite", "cookies.sqlite",
		"webcache", "edgehistory",
	},
	ArtifactMemoryProcess: {
		"process", "pid", "process list", "pslist", "psscan", "process tree",
		"running process",
	},
	ArtifactMemoryString: {
		"memory string", "strings -a", "yarascan", "in-memory string",
	},
	ArtifactNetworkConn: {
		"network connection", "tcp", "udp", "netscan", "netstat", "remote ip",
		"established connection",
	},
	ArtifactScheduledTask: {
		"scheduled task", "schtasks", "at job", "task scheduler",
	},
	ArtifactService: {
		"service", "services.exe", "svchost", "service installation",
	},
	ArtifactPersistence: {
		"persistence", "autorun", "startup", "boot persistence",
		"run key persistence", "service persistence",
	},
}

// SuspiciousIndicatorKeywords flag findings that warrant elevated scrutiny.
var SuspiciousIndicatorKeywords = []string{
	"powershell", "encoded command", "base64", "obfuscated",
	"mimikatz", "cobaltstrike", "metasploit", "meterpreter",
	"lateral movement", "credential dumping", "lsass", "sam hive",
	"reverse shell", "c2", "command and control",
	"persistence", "privilege escalation",
	"data exfiltration", "exfil", "ransomware",
}

// SIFTToolNames is the set of expected SIFT/Volatility/Plaso tools that
// findings may cite. The tool-execution stage uses this to detect made-up
// tool names (a common hallucination pattern).
var SIFTToolNames = []string{
	// Volatility 3
	"vol.py", "vol3.py", "vol",
	"windows.pslist", "windows.pstree", "windows.psscan",
	"windows.cmdline", "windows.dlllist", "windows.handles",
	"windows.netscan", "windows.netstat",
	"windows.malfind", "windows.hollowfind",
	"windows.registry.userassist", "windows.registry.shimcache",
	"windows.registry.amcache", "windows.registry.printkey",
	"linux.pslist", "linux.bash", "linux.lsmod",
	"mac.pslist",

	// Plaso / log2timeline
	"log2timeline.py", "psort.py", "pinfo.py", "image_export.py",

	// Sleuth Kit / Autopsy CLI
	"fls", "fsstat", "icat", "istat", "mmls", "mmstat", "blkcat",
	"tsk_recover", "tsk_loaddb",

	// SIFT / specific
	"regripper", "rip.pl", "rip", "amcache.pl", "shellbags.py",
	"prefetch", "winprefetchview",
	"mftecmd", "evtxecmd", "regtimeline",

	// Generic search/parse
	"strings", "grep", "yarascan", "yara", "xxd", "hexdump",

	// Disk imaging / mounting
	"ewfmount", "ewfinfo", "mmls", "mount", "losetup",
}

// MITREKeywordsToTTP maps human-language phrases to MITRE ATT&CK technique IDs.
// Used by the classify stage to auto-populate Finding.MitreTTPs when missing.
var MITREKeywordsToTTP = map[string][]string{
	"powershell encoded":      {"T1059.001", "T1027"},
	"run key":                 {"T1547.001"},
	"scheduled task":          {"T1053.005"},
	"service installation":    {"T1543.003"},
	"lsass":                   {"T1003.001"},
	"sam hive":                {"T1003.002"},
	"mimikatz":                {"T1003"},
	"lateral movement":        {"T1021"},
	"smb lateral":             {"T1021.002"},
	"rdp lateral":             {"T1021.001"},
	"data exfiltration":       {"T1041", "T1567"},
	"persistence":             {"T1547"},
	"defense evasion":         {"T1070"},
	"event log clearing":      {"T1070.001"},
	"shimcache":               {"T1112"},
	"prefetch deletion":       {"T1070.004"},
}
