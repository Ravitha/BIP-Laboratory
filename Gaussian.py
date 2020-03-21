from PIL import Image
from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
import numpy as np
import math
def Gaussian(kernel, sigma=1.0):
    mask = np.zeros([kernel, kernel], dtype='f')
    for i in range(kernel):
        for j in range(kernel):
            mask[i][j] = math.exp(-(math.pow(i-((kernel-1)/2),2) + math.pow(j-((kernel-1)/2),2)) / (2*math.pow(sigma,2)))
            mask[i][j] = 1/(math.pi * 2 * math.pow(sigma,2)) * mask[i][j] 
    return mask

mask = Gaussian(15, 5) 

fig = plt.figure()
ax = fig.gca(projection='3d')
X = np.arange(0,15,1)
Y = np.arange(0,15,1)
X, Y = np.meshgrid(X, Y)
Z = mask
surf = ax.plot_surface(X, Y, Z, cmap=cm.coolwarm,
                       linewidth=0, antialiased=False)

fig.colorbar(surf, shrink=0.5, aspect=5)
plt.show()
