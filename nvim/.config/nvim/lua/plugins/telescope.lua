return {
  "nvim-telescope/telescope.nvim",
  opts = {
    pickers = {
      find_files = {
        find_command = function(opts)
          local cmd = { "rg", "--files", "--color", "never", "-g", "!.git" }
          if opts.hidden then
            table.insert(cmd, "--hidden")
          end
          if opts.no_ignore then
            table.insert(cmd, "--no-ignore")
          end
          return cmd
        end,
      },
    },
  },
}
