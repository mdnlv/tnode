{
  description = "Flake for my portfolio";

  outputs = { self, nixpkgs }:
    let system = "x86_64-linux";
    in {
      devShell.${system} = (({ pkgs, ... }:
        pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            yarn
          ];

          shellHook = ''
          '';
        }) { pkgs = nixpkgs.legacyPackages.${system}; });
    };
}
