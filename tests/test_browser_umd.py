from __future__ import annotations

import json
import shutil
import subprocess
from html.parser import HTMLParser
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
INTERFACE = ROOT / "interface"
LOCAL_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
AMBIGUOUS_CASE = "El lateral fa una finta i després juga un 2x1 amb el pivot."
COMPLETE_CASE = (
    "El central passa al lateral. El lateral rep en carrera a l’interval 1–2, "
    "fa una finta contra D2 i surt cap a l’interval 2–3. "
    "Després juga un 2x1 amb el pivot contra D3."
)


class _ScriptSourceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.sources: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "script":
            return
        source = dict(attrs).get("src")
        if source:
            self.sources.append(source)


def _node() -> str:
    executable = shutil.which("node")
    if executable:
        return executable
    if LOCAL_NODE.is_file():
        return str(LOCAL_NODE)
    pytest.skip("Node no està disponible")


def _index_scripts() -> list[str]:
    parser = _ScriptSourceParser()
    parser.feed((INTERFACE / "index.html").read_text(encoding="utf-8"))
    return parser.sources


def _run_node(script: str) -> dict:
    completed = subprocess.run(
        [_node(), "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


@pytest.fixture(scope="module")
def browser_bundle() -> dict:
    sources = _index_scripts()
    script = f"""
const fs=require('fs');
const vm=require('vm');

class FakeClassList {{
  constructor() {{ this.values=new Set(); }}
  contains(value) {{ return this.values.has(value); }}
  toggle(value, force) {{
    const enabled=force === undefined ? !this.values.has(value) : Boolean(force);
    if (enabled) this.values.add(value); else this.values.delete(value);
    return enabled;
  }}
  add(...values) {{ values.forEach(value=>this.values.add(value)); }}
  remove(...values) {{ values.forEach(value=>this.values.delete(value)); }}
}}

class FakeElement {{
  constructor(selector, document) {{
    this.selector=selector; this.ownerDocument=document; this.listeners={{}};
    this.classList=new FakeClassList(); this.dataset={{}}; this.style={{}};
    this.value=''; this.textContent=''; this.innerHTML=''; this.hidden=false;
    this.disabled=false; this.checked=false; this.files=[]; this.children=[];
  }}
  addEventListener(type, listener) {{ (this.listeners[type] ||= []).push(listener); }}
  dispatch(type) {{
    const event={{preventDefault(){{}},stopPropagation(){{}},currentTarget:this,target:this}};
    (this.listeners[type] || []).forEach(listener=>listener(event));
  }}
  appendChild(child) {{ this.children.push(child); return child; }}
  insertAdjacentHTML(_position, html) {{ this.innerHTML += html; }}
  querySelector(selector) {{ return this.ownerDocument.element(`${{this.selector}} ${{selector}}`); }}
  querySelectorAll(_selector) {{ return []; }}
  setAttribute(name, value) {{ this[name]=String(value); }}
  getAttribute(name) {{ return this[name] ?? null; }}
  removeAttribute(name) {{ delete this[name]; }}
  closest(selector) {{ return this.ownerDocument.element(`${{this.selector}} closest ${{selector}}`); }}
  focus() {{}}
  click() {{ this.dispatch('click'); }}
  select() {{}}
  remove() {{}}
  showModal() {{ this.open=true; }}
  close() {{ this.open=false; }}
  reset() {{}}
}}

class FakeDocument {{
  constructor() {{ this.elements=new Map(); this.body=this.element('body'); }}
  element(selector) {{
    if (!this.elements.has(selector)) this.elements.set(selector,new FakeElement(selector,this));
    return this.elements.get(selector);
  }}
  querySelector(selector) {{ return this.element(selector); }}
  querySelectorAll(_selector) {{ return []; }}
  createElement(tag) {{ return new FakeElement(`<${{tag}}>`,this); }}
  execCommand() {{ return true; }}
}}

const document=new FakeDocument();
document.element('#builder-collection').value='participant';
document.element('#manual-primitive-type').value='entity';
const storage=new Map();
let uuid=0;
const context=vm.createContext({{
  console,
  document,
  navigator:{{clipboard:{{writeText:async()=>{{}}}}}},
  localStorage:{{
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  }},
  crypto:{{randomUUID:()=>`00000000-0000-4000-8000-${{String(++uuid).padStart(12,'0')}}`}},
  setTimeout:()=>1,
  clearTimeout:()=>{{}},
  Blob:class Blob {{}},
  URL:{{createObjectURL:()=>"blob:test",revokeObjectURL:()=>{{}}}},
  FileReader:class FileReader {{}}
}});
context.globalThis=context;
context.window=context;

const sources={json.dumps(sources)};
const loaded=[];
for (const source of sources) {{
  vm.runInContext(fs.readFileSync(`interface/${{source}}`,'utf8'),context,{{filename:source}});
  loaded.push(source);
}}

const requiredGlobals=[
  'TRACA_COURT_PROFILE','TRACA_UVOF015_GEOMETRY','TRACA_UVOF015_CASE',
  'TRACA_LOCAL_KNOWLEDGE','TRACA_VISUAL_FUNCTIONAL_DICTIONARY','TRACA_UTILS',
  'TRACA_VISUAL_GRAMMAR','TRACA_CHANGE_EXPLAINER','TRACA_GEOMETRY_DEPENDENCIES',
  'TRACA_CORRECTIONS','TRACA_INTERPRETATION','TRACA_INTERPRETATION_PROVIDER',
  'TRACA_KNOWLEDGE_RESOLVER','TRACA_COMPOSITION_GRAPH','TRACA_STATE_REGISTRY',
  'TRACA_BALL_FLOW','TRACA_SPATIAL_CONSTRAINTS','TRACA_COMPOSITION_OPERATORS',
  'TRACA_COMPOSITION_PREFLIGHT','TRACA_CLARIFICATION_ORCHESTRATOR',
  'TRACA_GENERIC_GEOMETRY_RESOLVER','TRACA_REPRESENTATION_COMPOSER',
  'TRACA_MANUAL_GEOMETRY','TRACA_WORKSPACE_PREFLIGHT','TRACA_PROMOTION',
  'TRACA_STORE','TRACA_PERSISTENCE','TRACA_IMPORT_EXPORT','TRACA_RENDERER',
  'TRACA_EDITOR','TRACA_KNOWLEDGE_LIBRARY','TRACA_INSPECTION_UI'
];

function generate(text) {{
  document.element('#description').value=text;
  document.element('#generate-case').dispatch('click');
  return {{
    understood:document.element('#understood-list').innerHTML,
    questionCount:document.element('#question-count').textContent,
    questions:JSON.parse(document.element('#diagnostic-questions').textContent),
    summary:document.element('#composition-human-summary').innerHTML
  }};
}}

const ambiguous=generate({json.dumps(AMBIGUOUS_CASE)});
const complete=generate({json.dumps(COMPLETE_CASE)});
process.stdout.write(JSON.stringify({{
  sources, loaded,
  missingGlobals:requiredGlobals.filter(name=>!context[name]),
  providerAliasIsExact:context.TRACA_INTERPRETATION === context.TRACA_INTERPRETATION_PROVIDER,
  clarifierProviderWorks:context.TRACA_CLARIFICATION_ORCHESTRATOR.canonicalDefenders().map(item=>item.id),
  ambiguous, complete
}}));
"""
    return _run_node(script)


def test_index_executes_every_browser_wrapper_in_order_with_required_globals(browser_bundle: dict) -> None:
    assert browser_bundle["loaded"] == browser_bundle["sources"] == _index_scripts()
    assert browser_bundle["missingGlobals"] == []
    assert browser_bundle["providerAliasIsExact"] is True
    assert browser_bundle["clarifierProviderWorks"] == ["D1", "D2", "D3"]


def test_browser_generate_projects_ambiguous_and_complete_cases(browser_bundle: dict) -> None:
    ambiguous = browser_bundle["ambiguous"]
    assert ambiguous["questionCount"] == "1"
    assert "0/2 accions compostes" in ambiguous["understood"]
    for concept in ("lateral", "pivot", "finta", "2x1"):
        assert concept in ambiguous["understood"].lower()
    assert ambiguous["questions"]["active_question"]["label"] == "Contra quin defensor fa la finta?"
    assert [option["value"] for option in ambiguous["questions"]["active_question"]["options"]] == ["D1", "D2", "D3"]
    assert "needs_input" in ambiguous["summary"]

    complete = browser_bundle["complete"]
    assert complete["questionCount"] == "0"
    assert "4/4 accions compostes" in complete["understood"]
    assert complete["questions"]["active_question"] is None
    assert complete["questions"]["questions"] == []
    assert "ready" in complete["summary"]
    assert "needs_input" in complete["summary"]


def test_clarification_orchestrator_fails_fast_without_browser_provider() -> None:
    script = """
const fs=require('fs');
const vm=require('vm');
const context=vm.createContext({console});
context.globalThis=context;
context.window=context;
vm.runInContext(fs.readFileSync('interface/js/utils.js','utf8'),context,{filename:'utils.js'});
vm.runInContext(fs.readFileSync('interface/js/composition-operators.js','utf8'),context,{filename:'composition-operators.js'});
let message=null;
try {
  vm.runInContext(fs.readFileSync('interface/js/clarification-orchestrator.js','utf8'),context,{filename:'clarification-orchestrator.js'});
} catch (error) {
  message=error.message;
}
process.stdout.write(JSON.stringify({message}));
"""
    assert _run_node(script)["message"] == "CLARIFICATION_PROVIDER_UNAVAILABLE"
