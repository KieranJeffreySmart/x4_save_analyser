import os
import argparse
import glob
import re

parser = argparse.ArgumentParser()
parser.add_argument(
    'sourcedir', help='The directory where the cat files are located')
parser.add_argument(
    'destdir', help='The directory where to extract any matching files')
parser.add_argument('-i', '--include', type=list, nargs='*',
                    help='files to include, by default this is all cat files found in the directory')
parser.add_argument('-f', '--filter', default='^.*(xml|xsd|html|js|css|lua)$',
                    help='A Regex filter of which embedded files to extract, by default this is xml,xsd,html,js,css,lua')

args = parser.parse_args()

pattern = re.compile(args.filter)

outdir = args.destdir
list_of_files = []

for file in os.listdir(args.sourcedir):
    if (not args.include and file.lower().endswith(".cat")) or (args.include and file in args.include):
        list_of_files.append(os.path.join(args.sourcedir, file))

for file in list_of_files:
    inf = open(file, "r")
    inf_data_name = "%s.dat" % file.split(".")[0]
    inf_data = open(inf_data_name, "rb")

    for line in inf:
        obj_data_split = line.split(" ")
        filepath = " ".join(obj_data_split[0:len(obj_data_split) - 3])
        obj_data = {"hash": obj_data_split[-1],
                    "modified_epoch": obj_data_split[-2],
                    "size": obj_data_split[-3],
                    "filepath": filepath}
        obj_data["path"] = os.path.dirname(obj_data["filepath"])
        obj_data["filename"] = obj_data["filepath"].split("/")[-1]

        if pattern.match(obj_data["filepath"]):
            if not os.path.isdir("%s/%s" % (outdir, obj_data["path"])):
                os.makedirs("%s/%s" % (outdir, obj_data["path"]))

            try:
                outf = open("%s/%s/%s" %
                            (outdir, obj_data["path"], obj_data["filename"]), "wb")
                outf.write(inf_data.read(int(obj_data["size"])))
                outf.close()
            except IOError:
                print(("[IOERROR] %s/%s/%s" %
                       (outdir, obj_data["path"], obj_data["filename"])))
        else:
            inf_data.read(int(obj_data["size"]))

    inf.close()