"""Add synthetic matching examples without resetting existing demo cases."""
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
os.environ['MONITOR_SCHEDULER'] = 'external'
from services.api.main import MODE, store, save, now, event

PROFILES = [
    ('Cedar', 'Fair skin, tall, wears glasses. Short brown hair. Checks their partner’s phone and restricts contact with friends.', 'Safety planning', 'high'),
    ('Willow', 'Tall person with fair skin and glasses. Brown hair. Monitors messages and controls who their partner talks to.', 'Housing', 'high'),
    ('Maple', 'Fair skin, glasses, tall. Usually wears a dark jacket. Controls household money and checks phone messages.', 'Financial', 'medium'),
    ('Birch', 'Short person with dark curly hair, no glasses. Restricts access to shared money.', 'Financial', 'low'),
]


def seed():
    if MODE != 'demo':
        raise SystemExit('Synthetic cases may only be added in demo mode.')
    ids = []
    for index, (name, description, category, severity) in enumerate(PROFILES):
        cid = str(uuid.uuid5(uuid.NAMESPACE_URL, 'hervoice/synthetic-matching-v1/' + name))
        ids.append(cid)
        if store.get(cid):
            continue
        narrative = 'Fictional demo report. I need support understanding my options. No real person or incident is represented.'
        save(dict(
            id=cid, org='demo-a', alias=f'Synthetic · {name}',
            original=narrative, narrative=narrative, category=category,
            details={'personDescription': description, 'duration': '', 'frequency': '', 'visibleInjuries': ''},
            contact={'method': 'none', 'value': '', 'safeTime': '', 'voicemail': False},
            location='Columbus, Ohio (synthetic)', urgent=severity == 'high',
            status='received' if index % 2 == 0 else 'in_review',
            priority='high' if severity == 'high' else 'normal', severity=severity,
            assignment='', version=1, created=now(), updated=now(), delivery='received_demo',
            events=[event('received', 'Synthetic matching example; no real person or incident.', 'seed')],
        ), idem='matching-demo-v1-' + name)
    return ids


if __name__ == '__main__':
    print('Synthetic demo cases ready:', ', '.join(seed()))
