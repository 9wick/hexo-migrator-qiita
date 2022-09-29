import {getQiitaJson} from "../qiita";

const TurndownService = require('turndown');
const got = require('got');
const {parse: parseUrl} = require('url');
const {exists, listDir, readFile} = require('hexo-fs');
const {slugize, unescapeHTML} = require('hexo-util');
const {join, parse} = require('path');
import type Hexo from "hexo";
import type {PromiseType} from "utility-types";


export const migrator = async function (this: Hexo, args: any) {
  const source = args._.shift();
  const {alias, redirect, addtag} = args;
  const skipduplicate = Object.prototype.hasOwnProperty.call(args, 'skipduplicate');
  let {limit} = args;
  const {config, log} = this;
  const Post = this.post;
  let untitledPostCounter = 0;
  let errNum = 0;
  let skipNum = 0;
  const rEntity = /&#?\w{2,4};/;
  const posts = [];
  let currentPosts = [];
  let feed: PromiseType<ReturnType<typeof getQiitaJson>>


  try {
    if (!source) {
      const help = [
        'Usage: hexo migrate qiita <username> [--alias]',
        '',
        'For more help, you can check the docs: http://hexo.io/docs/migration.html'
      ];

      throw help.join('\n');
    }

    feed = await getQiitaJson(source);
    log.info('Analyzing %s...', feed);

  } catch (err) {
    // @ts-ignore
    throw new Error(err);
  }

  if (feed) {
    if (typeof limit !== 'number' || limit > feed.length || limit <= 0) limit = feed.length;

    for (let i = 0; i < limit; i++) {
      const item = feed[i]!;
      const {created_at, tags, url} = item;
      let {body, title} = item;


      if (!title) {
        untitledPostCounter += 1;
        const untitledPostTitle = 'Untitled Post - ' + untitledPostCounter;
        title = untitledPostTitle;
        log.warn('Post found but without any titles. Using %s', untitledPostTitle);
      } else {
        log.info('Post found: %s', title);
      }

      if (rEntity.test(title)) title = unescapeHTML(title);
      if (title.includes('"') && (title.includes(':') || title.startsWith('#') || title.startsWith('!!'))) title = title.replace(/"/g, '\\"');

      const newPost = {
        title,
        date: created_at,
        tags: [...tags.map(t => t.name), ...(addtag ? ["qiita"] : [])],
        excerpt: body.slice(0, 100),
        content: body,
        alias: alias && url ? parseUrl(url).pathname : undefined,
        redirect: redirect && url ? url : undefined,
      };


      posts.push(newPost);
    }
  }

  if (skipduplicate) {
    const postFolder = join(config.source_dir, '_posts');
    const folderExist = await exists(postFolder);
    const files = folderExist ? await listDir(join(config.source_dir, '_posts')) : [];
    currentPosts = files.map((file: string) => slugize(parse(file).name, {transform: 1}));
  }

  if (posts.length >= 1) {
    for (const post of posts) {
      if (currentPosts.length && skipduplicate) {
        if (currentPosts.includes(slugize(post.title, {transform: 1}))) {
          skipNum++;
          continue;
        }
      }
      try {
        await Post.create(post);
      } catch (err) {
        log.error(err);
        errNum++;
      }
    }

    const postsNum = posts.length - errNum - skipNum;
    if (untitledPostCounter) {
      log.warn('%d posts did not have titles and were prefixed with "Untitled Post".', untitledPostCounter);
    }
    if (postsNum) log.info('%d posts migrated.', postsNum);
    if (errNum) log.error('%d posts failed to migrate.', errNum);
    if (skipNum) log.info('%d posts skipped.', skipNum);
  }
};

