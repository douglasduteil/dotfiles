return {
  "neovim/nvim-lspconfig",
  init = function()
    -- vtsls emits VS Code's "N references" lens command; Neovim cannot run it.
    vim.lsp.commands["editor.action.showReferences"] = function(cmd, ctx)
      local client = vim.lsp.get_client_by_id(ctx.client_id)
      local items = vim.lsp.util.locations_to_items(cmd.arguments[3] or {}, client and client.offset_encoding)
      vim.fn.setqflist({}, " ", { title = "References", items = items })
      vim.cmd.copen()
    end
  end,
  opts = {
    codelens = { enabled = true },
    servers = {
      vtsls = {
        settings = {
          typescript = { referencesCodeLens = { enabled = true } },
          javascript = { referencesCodeLens = { enabled = true } },
        },
      },
    },
  },
}
