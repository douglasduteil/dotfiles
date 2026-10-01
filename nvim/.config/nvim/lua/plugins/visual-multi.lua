return {
  "mg979/vim-visual-multi",
  branch = "master",
  init = function()
    vim.g.VM_mouse_mappings = 1 -- Ctrl+LeftClick add cursor, closest to VSCode Alt+Click
    vim.g.VM_maps = {
      ["Find Under"] = "<C-d>",
      ["Find Subword Under"] = "<C-d>",
      ["Select All"] = "<C-a>",
      ["Add Cursor Down"] = "<C-Down>",
      ["Add Cursor Up"] = "<C-Up>",
      ["Skip Region"] = "<C-k>", -- closest to VSCode Ctrl+K Ctrl+D (skip, next)
    }
    vim.g.VM_leader = "\\"
  end,
}
