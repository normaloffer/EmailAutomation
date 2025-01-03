#!/usr/bin/env perl

# postfix queue/s size
# author: Mamun

use strict;
use warnings;
use Symbol;
sub count {
        my ($dir) = @_;
        my $dh = gensym();
        my $c = 0;
        opendir($dh, $dir) or die "$0: opendir: $dir: $!\n";
        while (my $f = readdir($dh)) {
                if ($f =~ m{^[A-F0-9]{5,}$}) {
                        ++$c;
                } elsif ($f =~ m{^[A-F0-9]$}) {
                        $c += count("$dir/$f");
                }
        }
        closedir($dh) or die "closedir: $dir: $!\n";
        return $c;
}
my $qdir = `postconf -h queue_directory`;
chomp($qdir);
chdir($qdir) or die "$0: chdir: $qdir: $!\n";

printf "{";
printf "\"incoming\": %d,\n", count("incoming");
printf "\"active\": %d,\n", count("active");
printf "\"deferred\": %d,\n", count("deferred");
printf "\"bounced\": %d,\n", count("bounce");
printf "\"hold\": %d,\n", count("hold");
printf "\"corrupt\": %d\n", count("corrupt");
printf "}";