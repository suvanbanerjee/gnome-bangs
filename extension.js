/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

class BangsProvider {
    constructor(extension) {
        this._extension = extension;
        this.bangsData = extension.bangsData;
    }

    get appInfo() {
        return null;
    }

    get canLaunchSearch() {
        return true;
    }

    get id() {
        return this._extension.uuid;
    }

    activateResult(result, terms) {
        const context = new Gio.AppLaunchContext();

        // Get bang key (e.g., "!g") and query
        const input = terms.join(' ');
        const match = input.match(/^!(\S+)\s+(.+)$/);

        if (match) {
            const bangKey = match[1];
            const query = match[2];

            const bang = this.bangsData.find((b) => b.key === bangKey);
            if (bang) {
                const url = bang.url.replace('{query}', encodeURI(query));
                Gio.AppInfo.launch_default_for_uri(url, null);
            }
        }
    }

    launchSearch(terms) {
        return null;
    }

    createResultObject(meta) {
        return null;
    }

    getResultMetas(results, cancellable = null) {
        const gicon = Gio.icon_new_for_string(this._extension.path + '/bang.png');
        const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);

        return new Promise((resolve) => {
            const resultMetas = results.map((identifier) => ({
                id: identifier,
                name: 'Bangs Search',
                description: 'Use a bang (!bang) to search specific services',
                createIcon: (size) => new St.Icon({
                    gicon,
                    width: size * scaleFactor,
                    height: size * scaleFactor,
                    icon_size: size * scaleFactor,
                }),
            }));
            resolve(resultMetas);
        });
    }

    getInitialResultSet(terms, cancellable = null) {
        const input = terms.join(' ');
        const match = input.match(/^!(\w+)\s+/);

        if (match) {
            const bangKey = match[1];
            const bang = this.bangsData.find((b) => b.key === bangKey);

            if (bang) {
                return new Promise((resolve) => resolve(['Bang Search']));
            }
        }
        return new Promise((resolve) => resolve([]));
    }

    getSubsearchResultSet(results, terms, cancellable = null) {
        return this.getInitialResultSet(terms, cancellable);
    }

    filterResults(results, maxResults) {
        return results.slice(0, maxResults);
    }
}

export default class MyExtension extends Extension {
    constructor(meta) {
        super(meta);
        this._provider = null;
        this.bangsData = null;
    }

    _loadBangs() {
        const bangsFile = this.dir.get_child('bangs.json');
        const [, contents] = bangsFile.load_contents(null);
        const decoder = new TextDecoder();
        this.bangsData = JSON.parse(decoder.decode(contents));
    }

    _unloadBangs() {
        this.bangsData = null;
    }

    enable() {
        this._loadBangs();

        if (this._provider === null) {
            this._provider = new BangsProvider(this);
            Main.overview.searchController.addProvider(this._provider);
        }
    }

    disable() {
        if (this._provider instanceof BangsProvider) {
            Main.overview.searchController.removeProvider(this._provider);
            this._provider = null;
        }
        this._unloadBangs();
    }
}