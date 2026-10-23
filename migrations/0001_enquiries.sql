CREATE TABLE IF NOT EXISTS enquiries (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 destination TEXT NOT NULL,
 dates TEXT NOT NULL,
 product TEXT NOT NULL,
 skiers INTEGER NOT NULL CHECK (skiers BETWEEN 1 AND 20),
 ability TEXT NOT NULL,
 staying TEXT NOT NULL,
 message TEXT NOT NULL,
 availability_note TEXT NOT NULL,
 notification_status TEXT NOT NULL CHECK (notification_status IN ('pending','not_sent','accepted')),
 provider_id TEXT,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS enquiries_unreviewed ON enquiries(reviewed_at, created_at);
