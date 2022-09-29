/* global hexo */
'use strict';
import {migrator} from "./lib/migrator";

// @ts-ignore
const h: any = hexo;

h.extend.migrator.register('qiita', migrator);