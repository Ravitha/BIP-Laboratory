import numpy as np
import math
def Gaussian(kernel, sigma=1.0):
    mask = np.zeros([kernel, kernel], dtype='f')
    for i in range(kernel):
        for j in range(kernel):
            mask[i][j] = math.exp(-(math.pow(i-((kernel-1)/2),2) + math.pow(j-((kernel-1)/2),2)) / (2*math.pow(sigma,2)))
            mask[i][j] = 1/(math.pi * 2 * math.pow(sigma,2)) * mask[i][j] 
    return mask

mask = Gaussian(3, 1) 
print(mask)
