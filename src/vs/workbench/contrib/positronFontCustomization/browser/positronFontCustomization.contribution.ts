/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2026 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { DEFAULT_FONT_FAMILY } from '../../../../base/browser/fonts.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
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
	}
});

class PositronFontCustomizationContribution extends Disposable {

	static readonly ID = 'workbench.contrib.positronFontCustomization';

	constructor(
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@ILayoutService private readonly _layoutService: ILayoutService,
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
					e.affectsConfiguration('workbench.lineHeight')
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
	}
}

registerWorkbenchContribution2(PositronFontCustomizationContribution.ID, PositronFontCustomizationContribution, WorkbenchPhase.BlockRestore);
