{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.pip
    pkgs.nodejs_18
    pkgs.nodePackages.npm
  ];
}