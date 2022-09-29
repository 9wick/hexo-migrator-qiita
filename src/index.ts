/* global hexo */
'use strict';
import {migrator} from "./lib/migrator";

// @ts-ignore
const h: any = hexo;

debugger;
h.extend.migrator.register('qiita', migrator);