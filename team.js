const profiles = {
  'Ash Johns': {
    image: 'images/Ash-profile-pic.jpg', role: 'Ski Instructor',
    qualifications: "NZSIA L3 Ski · PSIE LPT · Children's L2 · L1 Race · Freeride L1 · Telemark L1 · AST L2",
    bio: 'With 20+ seasons of coaching experience across New Zealand, Jackson Hole, Whistler Blackcomb, and now Queenstown and Niseko Japan, skiing is my way of life. I love sharing my passion with all levels and look forward to making your mountain experience unforgettable.',
    links: [['Instagram','https://www.instagram.com/skimanz/'],['Facebook','https://www.facebook.com/ash.johns.5']]
  },
  'Tama Mitchell': {
    image: 'images/Tama-profile-pic.jpg', role: 'Ski & Snowboard Instructor',
    qualifications: 'NZSIA L2 Ski · L1 Snowboard · L1 Kids · L1 Freeride',
    bio: 'A dedicated local instructor based at The Remarkables and Coronet Peak, and also teaching in Niseko, Japan. My passion for skiing grew from a deep connection to the mountain lifestyle — freedom, adventure, and the outdoors. I aim to empower clients with greater confidence and an adventurous spirit both on the slopes and in life.',
    links: [['Instagram','https://www.instagram.com/tama.paewai/']]
  },
  'Andrea Morello': {
    image: 'images/AndreaMorello.jpg', role: 'Snowboard & Ski Instructor',
    qualifications: 'SBINZ L3 · NZSIA L1 · Adaptive Cert · Kids Cert',
    bio: "An Italian snowboarder chasing snow around the globe, Andrea has been based at The Remarkables since 2017 with seasons in Canada and Japan. Fluent in Italian and English, Andrea loves guiding guests from their first turns to steep off-piste powder runs.",
    links: [['Instagram','https://www.instagram.com/and.morre/']]
  },
  'Eden Kate Brown': {
    image: 'images/Eden.jpg', role: 'Ski & Snowboard Instructor',
    qualifications: 'NZSIA L2 Ski · L1 Snowboard · Kids Cert · Freeride Cert',
    bio: "Originally from the UK, Eden moved to New Zealand in 2019 to be a ski instructor. With a background in psychology and teaching, she combines learning science with a deep love of snowsports to help every guest overcome fears, build skills, and have the time of their lives.",
    links: [['Instagram','https://www.instagram.com/edenbr0wn1/']]
  }
};

const modal = document.createElement('div');
modal.className = 'profile-modal';
modal.setAttribute('aria-hidden','true');
modal.innerHTML = '<div class="profile-dialog" role="dialog" aria-modal="true"><button class="profile-close" aria-label="Close profile">×</button><img class="profile-image" alt=""><div class="profile-copy"><h2></h2><span class="profile-role"></span><p class="profile-quals"></p><p class="profile-bio"></p><div class="profile-links"></div></div></div>';
document.body.appendChild(modal);

function closeProfile(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
document.querySelectorAll('.team-card').forEach(card => {
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.setAttribute('aria-label','View ' + card.querySelector('strong').textContent + ' profile');
  const open = () => {
    const name = card.querySelector('strong').textContent;
    const p = profiles[name]; if (!p) return;
    modal.querySelector('.profile-image').src = p.image; modal.querySelector('.profile-image').alt = name;
    modal.querySelector('h2').textContent = name; modal.querySelector('.profile-role').textContent = p.role;
    modal.querySelector('.profile-quals').textContent = p.qualifications; modal.querySelector('.profile-bio').textContent = p.bio;
    modal.querySelector('.profile-links').innerHTML = p.links.map(([label,url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('');
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  };
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();open();} });
});
modal.querySelector('.profile-close').addEventListener('click',closeProfile);
modal.addEventListener('click',e=>{if(e.target===modal)closeProfile();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProfile();});

document.querySelectorAll('.faq-item button').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(other => other.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});
