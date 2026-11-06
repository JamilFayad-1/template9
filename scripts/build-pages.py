"""Generate the three progressive HTML pages from SOLË's shared shell."""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
DIST = ROOT / 'dist'

# Start from editable source files and regenerate a clean deployment folder.
shutil.rmtree(DIST, ignore_errors=True)
shutil.copytree(SRC, DIST)

home_path = SRC / 'index.html'
home = home_path.read_text()
home = re.sub(r'(src|href|poster)="(assets/|style.css|app.js|favicon.svg)', r'\1="/\2', home)
home = home.replace('<script src="/app.js" defer></script>', '<script type="module" src="/app.js"></script>')
if '/effects.css' not in home:
    home = home.replace('<link rel="stylesheet" href="/style.css">', '<link rel="stylesheet" href="/style.css">\n  <link rel="stylesheet" href="/vendor/lenis.css">\n  <link rel="stylesheet" href="/effects.css">\n  <link rel="stylesheet" href="/pages.css">')
home = home.replace('<body id="top">', '<body id="top" data-page="home">')
home = home.replace('href="#top" aria-label="SOLË home"', 'href="/" aria-label="SOLË home"')
home = re.sub(r'<nav class="desktop-nav".*?</nav>', '<nav class="desktop-nav" aria-label="Main navigation"><a href="/work/">Work <sup>(04)</sup></a><a href="/studio/">Studio</a><a href="/contact/">Let’s talk <span aria-hidden="true">↗</span></a></nav>', home, count=1, flags=re.S)
home = home.replace('href="#work" class="text-link">Discover our work', 'href="/work/" class="text-link">Discover our work')
home = home.replace('href="#approach" class="text-link">Meet our way of working', 'href="/studio/" class="text-link">Meet the studio')
home = re.sub(r'(<dialog class="menu-dialog".*?<nav aria-label="Expanded navigation">).*?(</nav>)', r'\1<a href="/"><small>00</small>Home<span>↗</span></a><a href="/work/"><small>01</small>Work<span>↗</span></a><a href="/studio/"><small>02</small>Studio<span>↗</span></a><a href="/contact/"><small>03</small>Let’s talk<span>↗</span></a>\2', home, count=1, flags=re.S)
home = home.replace('<dialog ', '<dialog data-lenis-prevent ')
home = home.replace('data-lenis-prevent data-lenis-prevent', 'data-lenis-prevent')
home = home.replace('class="brand" href="#top"', 'class="brand" href="/"')
if 'data-effects' not in home:
    home = home.replace('<span>Independent portfolio concept</span><button data-credits>', '<span>Independent portfolio concept</span><button data-effects aria-pressed="false">Motion on</button><button data-credits>')
(DIST / 'index.html').write_text(home)

main_start = home.index('  <main id="main">')
main_end = home.index('  </main>', main_start) + len('  </main>')
footer = re.search(r'    <footer.*?</footer>', home, re.S).group()
footer = footer.replace('href="#top"', 'href="/"')
services = re.search(r'<div class="services">.*?</div>(?=<a class="text-link" href="/contact/">)', home, re.S).group()
projects = re.search(r'<div class="project-grid">.*?</div>\s*<p class="concept-caption">', home, re.S).group().removesuffix('<p class="concept-caption">')
form = (ROOT / 'scripts/templates/brief-form.html').read_text().strip()

pages = {
    'work': ('Selected work', '''
    <section class="archive-intro page-gutter">
      
      <div class="archive-hero"><div class="archive-title"><h1 class="page-title reveal">Look.<br>A little<br>closer.</h1><p>Film, photography, and the space in between. A collection of visual studies with a point of view.</p><a href="#archive" class="text-link">The full collection <span aria-hidden="true">↙</span></a></div>
      <figure class="archive-portrait"><img class="archive-portrait-image" src="/assets/editorial-olive.webp" alt="Sunlit fashion portrait in an oversized olive jacket" fetchpriority="high"></figure></div>
    </section>
    <section class="archive-list page-gutter" id="archive"><div class="archive-list-heading"><h2>Every frame,<br>its own world.</h2><div class="filters" role="group" aria-label="Filter projects"><button class="active" data-filter="all" aria-pressed="true">All</button><button data-filter="film" aria-pressed="false">Film</button><button data-filter="stills" aria-pressed="false">Stills</button></div></div>''' + projects + '''<p class="concept-caption">Concept productions. Imagery curated for this independent portfolio study.</p></section>
    <section class="page-next page-gutter"><a href="/studio/">Inside the studio <span aria-hidden="true">↗</span></a></section>
'''),
    'studio': ('The studio', '''
    <section class="studio-intro studio-about page-gutter" aria-labelledby="studio-about-heading">
      <h1 id="studio-about-heading" class="studio-about-heading">About SOLË</h1>
      <p class="studio-about-copy reveal">Since 1990, SOLË has brought curious people together to make <span class="studio-word studio-word-film" tabindex="0">films<span class="studio-word-preview" aria-hidden="true"><img src="/assets/studio-poster.jpg" alt="" decoding="async"></span></span> and <span class="studio-word studio-word-image" tabindex="0">images<span class="studio-word-preview" aria-hidden="true"><img src="/assets/editorial-salt.webp" alt="" decoding="async"></span></span> with a point of view. We’re an independent creative production company, and we care about making <span class="studio-word studio-word-feeling" tabindex="0">things you feel<span class="studio-word-preview" aria-hidden="true"><img src="/assets/editorial-silhouette.webp" alt="" decoding="async"></span></span>. Every project starts with a conversation. <svg class="studio-pause" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 6C44 6 44 24 58 32C44 40 44 58 32 58C20 58 20 40 6 32C20 24 20 6 32 6Z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="currentColor"/></svg> We help the idea take shape, bring the right people into the room, and stay with it through the final frame.</p>
    </section>
    <section class="studio-manifesto page-gutter"><h2 class="reveal">We’re the people<br>who ask <span>“what if?”</span><br>Then make it happen.</h2><div class="studio-copy"><p>SOLË is a creative production company built around a simple idea: the work gets better when the right people come together.</p><p>We bring directors, photographers, makers, and curious minds into the same room. The team changes with the idea. The care stays the same.</p></div></section>
    <section class="studio-diptych page-gutter"><figure class="studio-film-still reveal"><button data-film aria-label="Play the SOLË studio film"><img src="/assets/studio-poster.jpg" alt="A photographer working with a creative crew on set" loading="lazy"><span>Inside SOLË ↗</span></button><figcaption>Where the idea meets the people.</figcaption></figure><div class="studio-photo-note"><h2 class="reveal">Close to<br>the idea.<br>All the way<br>through.</h2><p>We think, plan, make, and refine. A small core team keeps the conversation open and the vision intact, from the first reference to the last frame.</p></div></section>
    <section class="studio-practice page-gutter"><div class="studio-practice-grid"><h2 class="reveal">A little intuition.<br>A lot of craft.</h2><div>''' + services + '''<a href="/contact/" class="text-link">Bring us your idea <span aria-hidden="true">↗</span></a></div></div></section>
    <section class="studio-beliefs page-gutter"><article><span>Stay curious.</span><p>Look outside the brief. Ask another question. Leave space for the unexpected.</p></article><article><span>Make it together.</span><p>Different minds bring something you couldn’t have made alone.</p></article><article><span>Care to the end.</span><p>The small decisions are what make the whole thing feel right.</p></article></section>
    <section class="page-next page-gutter"><a href="/contact/">Let’s find the feeling <span aria-hidden="true">↗</span></a></section>
'''),
    'contact': ('Start a conversation', '''
    <section class="contact-page page-gutter"><h1 class="page-title reveal">Got a<br>feeling?</h1><div class="contact-page-grid"><div class="contact-page-note"><span>We’re all ears.</span><p>A big idea, a loose thought, a question you haven’t quite found the words for. This is a good place to start.</p><div class="contact-stamp" aria-hidden="true">S<span>O</span>LË</div><p class="contact-concept-note">This is a concept studio. Create a project brief to save and share with your own team.</p></div><div class="contact-form-panel">''' + form + '''</div></div></section>
    <section class="contact-faq page-gutter"><div class="contact-faq-grid"><details><summary>What should I put in a brief?<span aria-hidden="true">＋</span></summary><p>Start with what you want to make, who it’s for, and what you want people to feel. A few references, a timeline, and an idea of the scope help too.</p></details><details><summary>What if the idea is still taking shape?<span aria-hidden="true">＋</span></summary><p>That’s a perfectly good starting point. A conversation can help turn a loose thought into a clear creative direction.</p></details></div></section>
''')
}

for slug, (title, content) in pages.items():
    page = home[:main_start] + '  <main id="main" tabindex="-1">\n' + content + footer + '\n  </main>' + home[main_end:]
    page = page.replace('data-page="home"', f'data-page="{slug}"')
    page = page.replace('<title>SOLË / Creative production</title>', f'<title>{title} / SOLË</title>')
    page = page.replace('content="SOLË / Creative production"', f'content="{title} / SOLË"')
    path = DIST / slug / 'index.html'
    path.parent.mkdir(exist_ok=True)
    path.write_text(page)
print('Generated /work/, /studio/, and /contact/.')
