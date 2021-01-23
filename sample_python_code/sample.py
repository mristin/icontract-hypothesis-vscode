import re
import time

import icontract


@icontract.require(lambda name: re.match(r'^[A-Z][a-z]+$', name))
def print_hi(name: str):
    print(f"Hi {name!r}!")

@icontract.require(lambda name: re.match(r'^[A-Z][a-z]+$', name))
def print_oi(name: str):
    print(f"Oi {name!r}!")


if __name__ == '__main__':
    print_hi('Marko')
