import xml.etree.ElementTree as ET
import argparse
from xml.etree.ElementTree import ElementTree
from xml.etree.ElementTree import Element
from copy import deepcopy

parser = argparse.ArgumentParser()
parser.add_argument(
    'sourcepath', help='The directory and filename of the save file')
parser.add_argument(
    'destpath', help='The directory where to write any new files')

args = parser.parse_args()

outpath = args.destpath
sourcepath = args.sourcepath


mytree = ET.parse(sourcepath)
myroot = mytree.getroot()


# creating a new tag under the parent.
# myroot[0] here is the first food tag.
universe = myroot.findall('.//universe')

root = Element('savegame')
tree = ElementTree(root)
root.append(deepcopy(universe[0]))

tree.write(outpath)