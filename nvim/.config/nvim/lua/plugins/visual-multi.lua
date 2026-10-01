return {
  "mg979/vim-visual-multi",
  branch = "master",
  init = function()
    vim.g.VM_mouse_mappings = 1 -- Ctrl+LeftClick add cursor, closest to VSCode Alt+Click
    vim.g.VM_maps = {
      -- "Find Under"/"Select All" are permanent normal-mode maps (plugin-wide,
      -- always on) -- binding them to <C-d>/<C-a> would permanently shadow
      -- vim's half-page-scroll/increment. "Visual Find"/"Visual All" are
      -- visual-mode-only: select first (viw/v+motion), then extend -- same
      -- VSCode muscle memory, no clash. Cold-start find-under stays on the
      -- plugin's own default <C-n>.
      ["Visual Find"] = "<C-d>",
      ["Visual All"] = "<C-a>",
      ["Add Cursor Down"] = "<C-Down>",
      ["Add Cursor Up"] = "<C-Up>",
      ["Skip Region"] = "<C-k>", -- closest to VSCode Ctrl+K Ctrl+D (skip, next)
    }
    vim.g.VM_leader = "\\"
  end,
}
