"""수집한 첨부(corpus_g2b/manifest.json)에서 채점 대상 목록을 만든다.
- 같은 내용 파일(sha256) 중복 제거
- .pdf 는 같은 공고 안에 같은 이름 줄기(stem)의 .hwp/.hwpx 가 있을 때만 채점(정답을 그 hwp/hwpx 에서 뽑는다) → pairs.json
- 나머지 .hwp/.hwpx 는 그대로 채점
사용: python3 prepare_corpus.py corpus_g2b [--local local_docs.txt] → docs.txt, pairs.json
"""
import os, sys, json, re, argparse
from truth import sniff
def stem(name):
    s = os.path.splitext(name)[0].lower()
    s = re.sub(r'[\s_\-()\[\]【】「」.,·]+', '', s)
    # 2026-10-06: 앞머리(입찰공고문·제안요청서·과업지시서·붙임N…)를 지우던 줄을 뺐다 — 지우면 같은 사업명의
    # 다른 문서가 짝이 된다('입찰공고문(X).pdf' ↔ '과업지시서(X).hwp', '[붙임2]입찰공고문' ↔ '[붙임1]입찰공고문').
    # 47쌍 중 5쌍이 그렇게 틀린 정답으로 채점됐다.
    return s
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('corpus'); ap.add_argument('--local', default=None); ap.add_argument('--docs', default='docs.txt'); ap.add_argument('--pairs', default='pairs.json')
    a = ap.parse_args()
    man = json.load(open(os.path.join(a.corpus, 'manifest.json'), encoding='utf8'))
    seen = set(); docs = []; pairs = {}; n_pdf_unpaired = 0
    for m in man:
        files = [f for f in m['files'] if os.path.exists(f['path'])]
        hw = {}
        for f in files:
            if f['name'].lower().endswith(('.hwp', '.hwpx')): hw[stem(f['name'])] = f['path']
        for f in files:
            if f['sha256'] in seen: continue
            seen.add(f['sha256']); kind = sniff(f['path'])
            if kind in ('hwp', 'hwpx'): docs.append(f['path'])
            elif kind == 'pdf':
                t = hw.get(stem(f['name']))          # 이름 줄기가 정확히 같은 hwp/hwpx 만 짝으로 인정(느슨한 짝은 정답이 틀려 전 추출기가 같이 떨어진다)
                if t: docs.append(f['path']); pairs[f['path']] = t
                else: n_pdf_unpaired += 1
    if a.local: docs += [l.strip() for l in open(a.local) if l.strip()]
    open(a.docs, 'w').write('\n'.join(docs) + '\n'); json.dump(pairs, open(a.pairs, 'w'), ensure_ascii=False, indent=0)
    # 'LOCAL:' 접두어 = 로컬 시험셋 루트(기본 corpus_local/, 환경변수 LOCAL_DOCS_ROOT 로 재지정) — 목록에는 접두어 그대로 남긴다
    LOCAL = os.path.expanduser(os.environ.get('LOCAL_DOCS_ROOT', 'corpus_local/'))
    kinds = [sniff(d.replace('LOCAL:', LOCAL) if d.startswith('LOCAL:') else d) for d in docs]
    print(f'docs: {len(docs)} (hwp {kinds.count("hwp")}, hwpx {kinds.count("hwpx")}, pdf paired {kinds.count("pdf")}; pdf without hwp twin skipped {n_pdf_unpaired})')
