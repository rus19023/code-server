import { getOptions } from "../../common/util"
import "../register"

const options = getOptions()

// TODO: Add proper types.
/* eslint-disable @typescript-eslint/no-explicit-any */

// NOTE@jsjoeio
// This lives here ../../../lib/vscode/src/vs/base/common/platform.ts#L106
export const nlsConfigElementId = "vscode-remote-nls-configuration"

type NlsConfiguration = {
  locale: string
  availableLanguages: { [key: string]: string } | {}
  _languagePackId?: string
  _translationsConfigFile?: string
  _cacheRoot?: string
  _resolvedLanguagePackCoreLocation?: string
  _corruptedFile?: string
  _languagePackSupport?: boolean
  loadBundle?: any
}

/**
 * A helper function to get the NLS Configuration settings.
 *
 * This is used by VSCode for localizations (i.e. changing
 * the display language).
 *
 * Make sure to wrap this in a try/catch block when you call it.
 **/
export function getNlsConfiguration(document: Document) {
  const errorMsgPrefix = "[vscode]"
  const nlsConfigElement = document?.getElementById(nlsConfigElementId)
  const nlsConfig = nlsConfigElement?.getAttribute("data-settings")

  if (!document) {
    throw new Error(`${errorMsgPrefix} Could not parse NLS configuration. document is undefined.`)
  }

  if (!nlsConfigElement) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Could not find nlsConfigElement with id: ${nlsConfigElementId}`,
    )
  }

  if (!nlsConfig) {
    throw new Error(
      `${errorMsgPrefix} Could not parse NLS configuration. Found nlsConfigElement but missing data-settings attribute.`,
    )
  }

  return JSON.parse(nlsConfig) as NlsConfiguration
}

try {
  const nlsConfig = getNlsConfiguration(document)
  if (nlsConfig._resolvedLanguagePackCoreLocation) {
    const bundles = Object.create(null)
    nlsConfig.loadBundle = (bundle: any, _language: any, cb: any): void => {
      const result = bundles[bundle]
      if (result) {
        return cb(undefined, result)
      }
      // FIXME: Only works if path separators are /.
      const path = nlsConfig._resolvedLanguagePackCoreLocation + "/" + bundle.replace(/\//g, "!") + ".nls.json"
      fetch(`${options.base}/vscode/resource/?path=${encodeURIComponent(path)}`)
        .then((response) => response.json())
        .then((json) => {
          bundles[bundle] = json
          cb(undefined, json)
        })
        .catch(cb)
    }
  }
  ;(self.require as any) = {
    // Without the full URL VS Code will try to load file://.
    baseUrl: `${window.location.origin}${options.csStaticBase}/lib/vscode/out`,
    recordStats: true,
    paths: {
      "vscode-textmate": `../node_modules/vscode-textmate/release/main`,
      "vscode-oniguruma": `../node_modules/vscode-oniguruma/release/main`,
      xterm: `../node_modules/xterm/lib/xterm.js`,
      "xterm-addon-search": `../node_modules/xterm-addon-search/lib/xterm-addon-search.js`,
      "xterm-addon-unicode11": `../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js`,
      "xterm-addon-webgl": `../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js`,
      "tas-client-umd": `../node_modules/tas-client-umd/lib/tas-client-umd.js`,
      "iconv-lite-umd": `../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js`,
      jschardet: `../node_modules/jschardet/dist/jschardet.min.js`,
    },
    "vs/nls": nlsConfig,
  }
} catch (error) {
  console.error(error)
}

try {
  document.body.style.background = JSON.parse(localStorage.getItem("colorThemeData")!).colorMap["editor.background"]
} catch (error) {
  // Oh well.
}
