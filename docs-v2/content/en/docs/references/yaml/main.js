import { html, render } from 'https://unpkg.com/lit-html@1.1.2/lit-html.js';
import { unsafeHTML } from 'https://unpkg.com/lit-html@1.1.2/directives/unsafe-html.js';

var version;
let latest;

class YamlLink {
  constructor(url, label) {
    this.url = `#${url}`;
    this.label = label
  }

  render() {
    return html`<a class="yaml-link" href="${this.url}">${this.label}</a>`;
  }
}

(async function() {
  const versionParam = "?version=";
  const index = window.location.href.indexOf(versionParam);
  const table = document.getElementById('table');
  const versionInfo = document.getElementById('version-info')

  latest = table.attributes['latest'].value.trim();
  if (index === -1) {
    version = table.attributes['data-version'].value.trim();
    version = version.replace('skaffold/', '');
  } else {
    version = window.location.href.substr(index + versionParam.length);
    table.attributes['data-version'].value = 'skaffold/' + version;
  }

  const versionInfoResponse = await fetch(`/schemas/version-mappings/${version}-version.json`);
  if (versionInfoResponse.ok) {
    const versionInfoJson = await versionInfoResponse.json();
    render(html`
    <strong>Important:</strong> To use this schema, you need Skaffold version ${versionInfoJson.binVersion} or later.
    <a href="${versionInfoJson.releaseNoteLink}">Release Notes</a>
  `, versionInfo)
  }

  const response = await fetch(`/schemas/${version}.json`);
  const json = await response.json();

  render(html`
    ${template(json.definitions, undefined, json.anyOf[0].$ref, 0, "", [])}
  `, table);

  if (location.hash) {
    table.querySelector(location.hash).scrollIntoView();
  }
})();

function* template(definitions, parentDefinition, ref, ident, parent, parentLinks) {
  const name = ref.replace('#/definitions/', '');
  const allProperties = [];
  const seen = {};

  const properties = definitions[name].properties;
  for (const key of (definitions[name].preferredOrder || [])) {
    allProperties.push([key, properties[key]]);
    seen[key] = true;
  }

  const anyOfs = definitions[name].anyOf;
  for (const anyOf of (anyOfs || [])) {
    for (const key of (anyOf.preferredOrder || [])) {
      if (seen[key]) continue;

      allProperties.push([key, anyOf.properties[key]]);
      seen[key] = true;
    }
  }

  let index = -1;
  for (let [key, definition] of allProperties) {
    const path = parent.length == 0 ? key : `${parent}-${key}`;
    const propetyLabel = (definition.items && definition.items.$ref) ? `${key}[]`: `${key}`;
    const yamlLink = new YamlLink(path, propetyLabel);
    const pathLinks = [...parentLinks, yamlLink]
    const renderedPath = getPathLinkList(pathLinks);
    index++;

    // Key
    let required = definitions[name].required && definitions[name].required.includes(key);
    let keyClass = required ? 'key required' : 'key';

    // Value
    let value = definition.default;
    if (key === 'apiVersion') {
      value = `skaffold/${version}`;
    } else if (definition.examples && definition.examples.length > 0) {
      value = definition.examples[0];
    }
    let valueClass = definition.examples ? 'example' : 'value';

    // Description
    let desc = definition['x-intellij-html-description'];
    if (!desc) {
      desc = ""
    }
    
    // Don't duplicate definitions of top level sections such as build, test, deploy and portForward.
    if ((name === 'Profile') && definitions['SkaffoldConfig'].properties[key]) {
      value = '{}';
      yield html`
        <tr>
          <td>
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
            <span class="${valueClass}">${value}</span>
          </td>
          <td><span class="comment">#&nbsp;</span></td>
          <td><span class="comment">${unsafeHTML(desc)}</span></td>
        </tr>
      `;
      continue;
    }

    if (definition.$ref) {
      // Check if the referenced description is a final one
      const refName = definition.$ref.replace('#/definitions/', '');
      if (desc === "" && definitions[refName]['x-intellij-html-description']) {
        desc = definitions[refName]['x-intellij-html-description'];
      }
      if (!definitions[refName].properties && !definitions[refName].anyOf) {
        value = '{}';
      }

      yield html`
        <tr class="top">
          <td>
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
            <span class="${valueClass}">${value}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment">${unsafeHTML(desc)}</td>
        </tr>
      `;
    } else if (definition.items && definition.items.$ref) {
      const refName = definition.items.$ref.replace('#/definitions/', '');
      if (desc === "" && definitions[refName]['x-intellij-html-description']) {
        desc = definitions[refName]['x-intellij-html-description'];
      }
      yield html`
        <tr class="top">
          <td>
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
            <span class="${valueClass}">${value}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment">${unsafeHTML(desc)}</td>
        </tr>
      `;
    } else if (parentDefinition && (parentDefinition.type === 'array') && (index === 0)) {
      yield html`
        <tr>
          <td>
            
            <span class="${keyClass}" style="margin-left: ${(ident - 1) * 20}px">- ${anchor(path, key)}:${tooltip(renderedPath)}</span>
            <span class="${valueClass}">${value}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment">${unsafeHTML(desc)}</td>
        </tr>
      `;
    } else if ((definition.type === 'array') && value && (value !== '[]')) {
      // Parse value to json array
      const values = JSON.parse(value);

      yield html`
        <tr>
          <td>
          
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment" rowspan="${1 + values.length}">
            ${unsafeHTML(desc)}
          </td>
        </tr>
      `;

      for (const v of values) {
        yield html`
          <tr>
            <td>
              <span class="key" style="margin-left: ${ident * 20}px">- <span class="${valueClass}">${JSON.stringify(v)}</span></span>
            </td>
            <td class="comment">#&nbsp;</td>
          </tr>
        `;
      }
    } else if (definition.type === 'object' && value && value !== '{}') {
      // Parse value to json object
      const values = JSON.parse(value);

      yield html`
        <tr>
          <td>
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment" rowspan="${1 + Object.keys(values).length}">
            ${unsafeHTML(desc)}
          </td>
        </tr>
      `;

      for (const k in values) {
        if (!values.hasOwnProperty(k)) continue;
        const v = values[k];

        yield html`
          <tr>
            <td>
              
              <span class="key" style="margin-left: ${(ident + 1) * 20}px">${k}:${tooltip(renderedPath)}<span class="${valueClass}">${v}</span>
              </span>
            </td>
            <td class="comment">#&nbsp;</td>
          </tr>
        `;
      }
    } else {
      yield html`
        <tr>
          <td>
            <span class="${keyClass}" style="margin-left: ${ident * 20}px">${anchor(path, key)}:${tooltip(renderedPath)}</span>
            <span class="${valueClass}">${value}</span>
            <span class="${keyClass}">${getLatest(key === 'apiVersion' && latest === value)}</span>
          </td>
          <td class="comment">#&nbsp;</td>
          <td class="comment">${unsafeHTML(desc)}</td>
        </tr>
      `;
    }

    // This definition references another definition
    if (definition.$ref) {
      yield html`
        ${template(definitions, definition, definition.$ref, ident + 1, path, pathLinks)}
      `;
    }

    // This definition is an array
    if (definition.items && definition.items.$ref) {
      // don't infinitely recurse into nested tagger components
      if (definition.items.$ref === "#/definitions/TaggerComponent") {
        yield html ``;
      } else {
        yield html`
          ${template(definitions, definition, definition.items.$ref, ident + 1, path, pathLinks)}
        `;
      }
    }
  }
}

function getLatest(isLatest) {
  return isLatest ? "latest" : "";
}

function anchor(path, label) {
    return html`<a class="anchor" id="${path}"></a><a class="key stooltip__anchor" href="#${path}">${label}</a>`;
}

function tooltip(content) {
  return html`<span class="stooltip"><span class="stooltip__content">${content}<span class="stooltip__icon"><i class="fas fa-arrow-left"></i></span></span>`;
}

function getPathLinkList(yamlLinks) {
  return html`${joinTemplates(yamlLinks.map((yamlLink) => yamlLink.render()), html`<span class="yaml-link__separator">.</span>`)}`;
}

function joinTemplates(templates=[html``], separator=html` `) {
  const joinedTemplates = [];

  for (const template of templates) {
    joinedTemplates.push(template);
    joinedTemplates.push(separator);
  }
  joinedTemplates.pop();

  return joinedTemplates;
}
