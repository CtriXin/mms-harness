/** The overlay's own copy. The product name is a proper noun in both locales. */
export const zh = {
  'brand.name': 'MMS Harness',
}

export const en: Record<MmsKey, string> = {
  'brand.name': 'MMS Harness',
}

export type MmsKey = keyof typeof zh

/**
 * The project-first folder dialog's copy: upstream's browse keys (the dialog
 * is a copy of that package's) plus project search.
 */
export const projectsZh = {
  'browser.title': '找到你的项目',
  'browser.searchProjects': '搜索项目名或输入文件夹路径',
  'browser.projects': '已有项目',
  'browser.go': '前往',
  'browser.home': '主目录',
  'browser.newFolder': '新建文件夹',
  'browser.folderName': '文件夹名称',
  'browser.createIn': '在"{name}"中新建文件夹',
  'browser.untitledFolder': '未命名文件夹',
  'browser.create': '创建',
  'browser.cancel': '取消',
  'browser.open': '打开',
  'browser.editPath': '编辑路径',
  'browser.loading': '加载中…',
  'browser.truncated': '文件夹过多，仅显示开头部分。',
  'browser.showHidden': '显示隐藏文件',
}

export const projectsEn: Record<keyof typeof projectsZh, string> = {
  'browser.title': 'Find your project',
  'browser.searchProjects': 'Search projects or enter a folder path',
  'browser.projects': 'Your projects',
  'browser.go': 'Go',
  'browser.home': 'Home',
  'browser.newFolder': 'New folder',
  'browser.folderName': 'Folder name',
  'browser.createIn': 'New folder in "{name}"',
  'browser.untitledFolder': 'Untitled folder',
  'browser.create': 'Create',
  'browser.cancel': 'Cancel',
  'browser.open': 'Open',
  'browser.editPath': 'Edit path',
  'browser.loading': 'Loading…',
  'browser.truncated': 'Too many folders to list; only the beginning is shown.',
  'browser.showHidden': 'Show hidden files',
}
