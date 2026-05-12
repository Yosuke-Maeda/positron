/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { DEFAULT_FONT_FAMILY } from '../../../../base/browser/fonts.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { ConfigurationTarget, IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { workbenchConfigurationNodeBase } from '../../../common/configuration.js';
import * as nls from '../../../../nls.js';

const configurationRegistry = Registry.as<IConfigurationRegistry>(
	Extensions.Configuration
);

configurationRegistry.registerConfiguration({
	...workbenchConfigurationNodeBase,
	properties: {
		'workbench.fontFamily': {
			scope: ConfigurationScope.APPLICATION,
			type: 'string',
			default: '',
			description: nls.localize('workbench.fontFamily', "Controls the font family for the workbench UI. Empty uses the platform default. The value is prepended to the default font family for fallback safety."),
		},
		'workbench.fontSize': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('workbench.fontSize', "Controls the font size in pixels for the workbench UI. 0 uses the default (13px). Valid range: 8-20."),
		},
		'workbench.fontWeight': {
			scope: ConfigurationScope.APPLICATION,
			type: 'string',
			default: 'normal',
			description: nls.localize('workbench.fontWeight', "Controls the font weight for the workbench UI. Accepts \"normal\", \"bold\", or a numeric value between 1 and 1000."),
		},
		'workbench.fontLigatures': {
			scope: ConfigurationScope.APPLICATION,
			type: ['boolean', 'string'],
			default: false,
			description: nls.localize('workbench.fontLigatures', "Enables font ligatures for the workbench UI. Set to true to enable standard ligatures, or provide a CSS font-feature-settings string."),
		},
		'workbench.fontVariations': {
			scope: ConfigurationScope.APPLICATION,
			type: ['boolean', 'string'],
			default: false,
			description: nls.localize('workbench.fontVariations', "Enables font variations for the workbench UI. Set to true to enable default variations, or provide a CSS font-variation-settings string."),
		},
		'workbench.letterSpacing': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('workbench.letterSpacing', "Controls the letter spacing in pixels for the workbench UI. 0 means no override."),
		},
		'workbench.lineHeight': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('workbench.lineHeight', "Controls the line height in pixels for the workbench UI. 0 uses the default CSS line height (1.4em)."),
		},
		// Font settings dedicated to rendered Markdown cells in notebooks.
		// On change / startup the values are mirrored into the stock notebook keys (notebook.markup.*)
		// AND injected as CSS variables (--vscode-positronNotebook-markdown-*) for the Positron notebook.
		'notebookMarkdown.fontFamily': {
			scope: ConfigurationScope.APPLICATION,
			type: 'string',
			default: '',
			description: nls.localize('positron.notebookMarkdown.fontFamily', "Controls the font family for rendered Markdown cells in notebooks. Empty inherits the workbench font. Mirrored to `#notebook.markup.fontFamily#` for the stock notebook."),
		},
		'notebookMarkdown.fontSize': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('positron.notebookMarkdown.fontSize', "Controls the font size in pixels for rendered Markdown cells in notebooks. 0 uses the notebook default. Valid range: 8-32. Mirrored to `#notebook.markup.fontSize#` for the stock notebook."),
		},
		'notebookMarkdown.fontWeight': {
			scope: ConfigurationScope.APPLICATION,
			type: 'string',
			default: 'normal',
			description: nls.localize('positron.notebookMarkdown.fontWeight', "Controls the font weight for rendered Markdown cells in notebooks. Accepts \"normal\", \"bold\", or a numeric value between 1 and 1000. Applies only to the Positron notebook."),
		},
		'notebookMarkdown.fontLigatures': {
			scope: ConfigurationScope.APPLICATION,
			type: ['boolean', 'string'],
			default: false,
			description: nls.localize('positron.notebookMarkdown.fontLigatures', "Enables font ligatures for rendered Markdown cells in notebooks. Set to true to enable standard ligatures, or provide a CSS font-feature-settings string. Applies only to the Positron notebook."),
		},
		'notebookMarkdown.fontVariations': {
			scope: ConfigurationScope.APPLICATION,
			type: ['boolean', 'string'],
			default: false,
			description: nls.localize('positron.notebookMarkdown.fontVariations', "Enables font variations for rendered Markdown cells in notebooks. Set to true to enable default variations, or provide a CSS font-variation-settings string. Applies only to the Positron notebook."),
		},
		'notebookMarkdown.letterSpacing': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('positron.notebookMarkdown.letterSpacing', "Controls the letter spacing in pixels for rendered Markdown cells in notebooks. 0 means no override. Applies only to the Positron notebook."),
		},
		'notebookMarkdown.lineHeight': {
			scope: ConfigurationScope.APPLICATION,
			type: 'number',
			default: 0,
			description: nls.localize('positron.notebookMarkdown.lineHeight', "Controls the line height in pixels for rendered Markdown cells in notebooks. 0 uses the notebook default. Mirrored to `#notebook.markdown.lineHeight#` for the stock notebook."),
		},
	}
});

// Positron setting keys for the notebook Markdown font customization.
const NOTEBOOK_MARKDOWN_KEYS = [
	'notebookMarkdown.fontFamily',
	'notebookMarkdown.fontSize',
	'notebookMarkdown.fontWeight',
	'notebookMarkdown.fontLigatures',
	'notebookMarkdown.fontVariations',
	'notebookMarkdown.letterSpacing',
	'notebookMarkdown.lineHeight',
] as const;

class PositronFontCustomizationContribution extends Disposable {

	static readonly ID = 'workbench.contrib.positronFontCustomization';

	constructor(
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@ILayoutService private readonly _layoutService: ILayoutService,
		@ILogService private readonly _logService: ILogService,
	) {
		super();

		this._applyFontSettings();

		this._register(
			this._configurationService.onDidChangeConfiguration((e) => {
				if (
					e.affectsConfiguration('workbench.fontFamily') ||
					e.affectsConfiguration('workbench.fontSize') ||
					e.affectsConfiguration('workbench.fontWeight') ||
					e.affectsConfiguration('workbench.fontLigatures') ||
					e.affectsConfiguration('workbench.fontVariations') ||
					e.affectsConfiguration('workbench.letterSpacing') ||
					e.affectsConfiguration('workbench.lineHeight') ||
					NOTEBOOK_MARKDOWN_KEYS.some(k => e.affectsConfiguration(k))
				) {
					this._applyFontSettings();
				}
			})
		);
	}

	private _applyFontSettings(): void {
		const container = this._layoutService.mainContainer;
		const style = container.style;

		// Font family
		const fontFamily = (this._configurationService.getValue<string>('workbench.fontFamily') ?? '').trim();
		if (fontFamily) {
			style.fontFamily = `${fontFamily}, ${DEFAULT_FONT_FAMILY}`;
		} else {
			style.removeProperty('font-family');
		}

		// Font size
		const fontSize = this._configurationService.getValue<number>('workbench.fontSize') ?? 0;
		if (fontSize >= 8 && fontSize <= 20) {
			style.fontSize = `${fontSize}px`;
		} else {
			style.removeProperty('font-size');
		}

		// Font weight
		const fontWeight = this._configurationService.getValue<string>('workbench.fontWeight') ?? 'normal';
		if (fontWeight !== 'normal') {
			style.fontWeight = fontWeight;
		} else {
			style.removeProperty('font-weight');
		}

		// Font ligatures
		const fontLigatures = this._configurationService.getValue<boolean | string>('workbench.fontLigatures') ?? false;
		if (fontLigatures) {
			style.fontFeatureSettings = fontLigatures === true ? '"liga"' : String(fontLigatures);
		} else {
			style.removeProperty('font-feature-settings');
		}

		// Font variations
		const fontVariations = this._configurationService.getValue<boolean | string>('workbench.fontVariations') ?? false;
		if (fontVariations) {
			style.fontVariationSettings = fontVariations === true ? '"wght" 400' : String(fontVariations);
		} else {
			style.removeProperty('font-variation-settings');
		}

		// Letter spacing
		const letterSpacing = this._configurationService.getValue<number>('workbench.letterSpacing') ?? 0;
		if (letterSpacing !== 0) {
			style.letterSpacing = `${letterSpacing}px`;
		} else {
			style.removeProperty('letter-spacing');
		}

		// Line height
		const lineHeight = this._configurationService.getValue<number>('workbench.lineHeight') ?? 0;
		if (lineHeight > 0) {
			style.lineHeight = `${lineHeight}px`;
		} else {
			style.removeProperty('line-height');
		}

		// Apply notebook Markdown font settings.
		// Inject CSS variables for the Positron-native notebook AND mirror the matching
		// values into the stock notebook keys (notebook.markup.* / notebook.markdown.*)
		// so the same user-facing settings drive both implementations.
		this._applyNotebookMarkdownSettings(style);
	}

	private _applyNotebookMarkdownSettings(style: CSSStyleDeclaration): void {
		// --- CSS variable injection (for the Positron-native notebook) ---
		// When a value is unset (= default), remove the CSS variable so the rule
		// `var(--name, inherit)` falls back to inheriting from the parent element.

		// font-family
		const fontFamily = (this._configurationService.getValue<string>('notebookMarkdown.fontFamily') ?? '').trim();
		if (fontFamily) {
			// Append DEFAULT_FONT_FAMILY as a safety net for missing/unavailable fonts.
			style.setProperty('--vscode-positronNotebook-markdown-font-family', `${fontFamily}, ${DEFAULT_FONT_FAMILY}`);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-font-family');
		}

		// font-size (px, valid range 8-32)
		const fontSize = this._configurationService.getValue<number>('notebookMarkdown.fontSize') ?? 0;
		const fontSizeValid = fontSize >= 8 && fontSize <= 32;
		if (fontSizeValid) {
			style.setProperty('--vscode-positronNotebook-markdown-font-size', `${fontSize}px`);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-font-size');
		}

		// font-weight
		const fontWeight = this._configurationService.getValue<string>('notebookMarkdown.fontWeight') ?? 'normal';
		if (fontWeight !== 'normal') {
			style.setProperty('--vscode-positronNotebook-markdown-font-weight', fontWeight);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-font-weight');
		}

		// font-feature-settings (font-ligatures)
		const fontLigatures = this._configurationService.getValue<boolean | string>('notebookMarkdown.fontLigatures') ?? false;
		if (fontLigatures) {
			style.setProperty(
				'--vscode-positronNotebook-markdown-font-feature-settings',
				fontLigatures === true ? '"liga"' : String(fontLigatures)
			);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-font-feature-settings');
		}

		// font-variation-settings
		const fontVariations = this._configurationService.getValue<boolean | string>('notebookMarkdown.fontVariations') ?? false;
		if (fontVariations) {
			style.setProperty(
				'--vscode-positronNotebook-markdown-font-variation-settings',
				fontVariations === true ? '"wght" 400' : String(fontVariations)
			);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-font-variation-settings');
		}

		// letter-spacing (px)
		const letterSpacing = this._configurationService.getValue<number>('notebookMarkdown.letterSpacing') ?? 0;
		if (letterSpacing !== 0) {
			style.setProperty('--vscode-positronNotebook-markdown-letter-spacing', `${letterSpacing}px`);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-letter-spacing');
		}

		// line-height (px, 0 keeps the default)
		const lineHeight = this._configurationService.getValue<number>('notebookMarkdown.lineHeight') ?? 0;
		if (lineHeight > 0) {
			style.setProperty('--vscode-positronNotebook-markdown-line-height', `${lineHeight}px`);
		} else {
			style.removeProperty('--vscode-positronNotebook-markdown-line-height');
		}

		// --- Mirror into the stock notebook keys ---
		// Only the three keys that have a stock equivalent are mirrored. Skip the write
		// when the current value already matches to avoid feedback loops via
		// onDidChangeConfiguration.
		this._mirrorIfChanged('notebook.markup.fontFamily', fontFamily);
		this._mirrorIfChanged('notebook.markup.fontSize', fontSizeValid ? fontSize : 0);
		this._mirrorIfChanged('notebook.markdown.lineHeight', lineHeight > 0 ? lineHeight : 0);
	}

	/**
	 * Mirror the value to ConfigurationTarget.USER only when it differs from the current
	 * value. `updateValue` may reject (e.g. read-only configuration), so the failure is
	 * logged and swallowed -- a mirroring failure should not block workbench startup.
	 */
	private _mirrorIfChanged(key: string, value: unknown): void {
		const current = this._configurationService.getValue(key);
		if (current === value) {
			return;
		}
		this._configurationService.updateValue(key, value, ConfigurationTarget.USER).catch(err => {
			this._logService.warn(`[positronFontCustomization] Failed to mirror ${key}:`, err);
		});
	}
}

registerWorkbenchContribution2(PositronFontCustomizationContribution.ID, PositronFontCustomizationContribution, WorkbenchPhase.BlockRestore);
